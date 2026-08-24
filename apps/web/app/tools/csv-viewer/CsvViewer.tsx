'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Button, FileDropzone } from '@aakasa/ui';
import {
  countEmptyCells,
  findAndReplace,
  findDuplicateRows,
  gridToJson,
  parseCsvGrid,
  removeColumn,
  removeEmptyColumns,
  removeEmptyRows,
  removeRows,
  renameColumn,
  serializeCsvGrid,
  setCellValue,
  sortColumn,
  trimColumnWhitespace,
  trimWhitespace,
  type CsvGridData,
  type FindReplaceOptions,
  type SortDirection,
} from './utils/csvGridOperations';
import { detectColumnSuggestions, applyColumnSuggestion, type ColumnSuggestion } from './utils/columnSuggestions';
import { canRedo, canUndo, createUndoState, pushUndoState, redo, undo, type UndoState } from './utils/undoStack';
import type { ParseCsvWorkerRequest, ParseCsvWorkerResponse } from './workers/parseCsv.worker';

interface Snapshot {
  data: CsvGridData;
  label: string;
}

// Matches CSV↔JSON Converter's own thresholds for moving parsing off the
// main thread, for consistency across the two tools that both parse CSV.
const LARGE_INPUT_THRESHOLD_BYTES = 1_000_000;
const LARGE_ROW_THRESHOLD = 5000;

// Practical, honest ceiling for a client-side, in-memory tool — not a hard
// block, just a heads-up that the tab may get sluggish past this.
const WARN_ROW_THRESHOLD = 100_000;
const WARN_BYTE_THRESHOLD = 50_000_000;

// Undo snapshots are full grid copies. For a very large dataset, keeping 20
// of them could mean holding ~20x the data in memory just for history, so
// the cap shrinks for big grids to bound that cost.
const UNDO_LIMIT_DEFAULT = 20;
const UNDO_LIMIT_LARGE = 5;
const UNDO_LARGE_ROW_THRESHOLD = 20_000;

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const VIEWPORT_HEIGHT = 440;
const OVERSCAN = 8;
const ROW_NUM_WIDTH = 84;
const CELL_WIDTH = 176;

function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

function estimateRowCount(text: string): number {
  return (text.match(/\n/g)?.length ?? 0) + 1;
}

function useCsvParseWorker() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRef = useRef(new Map<number, (response: ParseCsvWorkerResponse) => void>());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./workers/parseCsv.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<ParseCsvWorkerResponse>) => {
        const resolve = pendingRef.current.get(event.data.id);
        if (resolve) {
          resolve(event.data);
          pendingRef.current.delete(event.data.id);
        }
      };
      workerRef.current = worker;
    }
    return workerRef.current;
  }, []);

  return useCallback(
    (csvText: string): Promise<ParseCsvWorkerResponse> => {
      const worker = getWorker();
      const id = (requestIdRef.current += 1);
      return new Promise((resolve) => {
        pendingRef.current.set(id, resolve);
        const request: ParseCsvWorkerRequest = { id, csvText };
        worker.postMessage(request);
      });
    },
    [getWorker],
  );
}

function suggestionKey(suggestion: ColumnSuggestion): string {
  return `${suggestion.columnIndex}:${suggestion.type}`;
}

export function CsvViewer() {
  const [history, setHistory] = useState<UndoState<Snapshot> | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [editingHeaderValue, setEditingHeaderValue] = useState('');
  const [openColumnMenu, setOpenColumnMenu] = useState<number | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findScope, setFindScope] = useState<'all' | 'column'>('all');
  const [findScopeColumn, setFindScopeColumn] = useState(0);
  const [replacePreview, setReplacePreview] = useState<{ data: CsvGridData; count: number } | null>(null);
  const [duplicatePreview, setDuplicatePreview] = useState<number[] | null>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const runInWorker = useCsvParseWorker();

  const data = history?.present.data ?? null;
  const headerSignature = data?.headers.join(' ');

  useEffect(() => {
    // Header list changed (rename, add, remove) — dismissed-suggestion keys
    // are index-based, so stale dismissals could otherwise silently hide a
    // suggestion on a now-different column.
    setDismissedSuggestions(new Set());
  }, [headerSignature]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenColumnMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    if (!data) return [];
    const all = detectColumnSuggestions(data);
    return all.filter((suggestion) => !dismissedSuggestions.has(suggestionKey(suggestion)));
  }, [data, dismissedSuggestions]);

  const emptyCellCount = useMemo(() => (data ? countEmptyCells(data) : 0), [data]);

  function commit(next: CsvGridData, label: string) {
    setHistory((prev) => {
      const limit = next.rows.length > UNDO_LARGE_ROW_THRESHOLD ? UNDO_LIMIT_LARGE : UNDO_LIMIT_DEFAULT;
      const snapshot: Snapshot = { data: next, label };
      return prev ? pushUndoState(prev, snapshot, limit) : createUndoState(snapshot);
    });
    setSelectedRows(new Set());
    setReplacePreview(null);
    setDuplicatePreview(null);
  }

  async function loadCsvText(text: string) {
    setLoadError(null);
    setIsLoading(true);
    try {
      const isLarge = getByteSize(text) > LARGE_INPUT_THRESHOLD_BYTES || estimateRowCount(text) > LARGE_ROW_THRESHOLD;
      const result = isLarge ? (await runInWorker(text)).result : parseCsvGrid(text);

      if (result.error || !result.data) {
        setLoadError(result.error ?? 'Could not parse this file as CSV.');
        return;
      }

      const rowCount = result.data.rows.length;
      const byteSize = getByteSize(text);
      if (rowCount > WARN_ROW_THRESHOLD || byteSize > WARN_BYTE_THRESHOLD) {
        setSizeWarning(
          `This file has ${rowCount.toLocaleString()} rows (${(byteSize / 1_000_000).toFixed(1)} MB). That's beyond the practical comfort zone for a browser-based, in-memory tool — things may get sluggish. If the tab feels slow, try working with a smaller subset of the file.`,
        );
      } else {
        setSizeWarning(null);
      }

      setHistory(createUndoState({ data: result.data, label: 'Load data' }));
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelected(file: File) {
    void file.text().then((text) => void loadCsvText(text));
  }

  function handlePasteLoad() {
    if (!pasteText.trim()) return;
    void loadCsvText(pasteText);
  }

  function handleStartOver() {
    setHistory(null);
    setPasteText('');
    setLoadError(null);
    setSizeWarning(null);
    setSelectedRows(new Set());
  }

  // --- Column actions ---

  function handleSortColumn(columnIndex: number, direction: SortDirection) {
    if (!data) return;
    commit(sortColumn(data, columnIndex, direction), `Sort "${data.headers[columnIndex]}" ${direction}`);
    setOpenColumnMenu(null);
  }

  function handleTrimColumn(columnIndex: number) {
    if (!data) return;
    commit(trimColumnWhitespace(data, columnIndex), `Trim "${data.headers[columnIndex]}"`);
    setOpenColumnMenu(null);
  }

  function handleRemoveColumn(columnIndex: number) {
    if (!data) return;
    commit(removeColumn(data, columnIndex), `Remove column "${data.headers[columnIndex]}"`);
    setOpenColumnMenu(null);
  }

  function handleAcceptSuggestion(suggestion: ColumnSuggestion) {
    if (!data) return;
    commit(applyColumnSuggestion(data, suggestion), `Fix "${data.headers[suggestion.columnIndex]}" formatting`);
    setOpenColumnMenu(null);
  }

  function handleDismissSuggestion(suggestion: ColumnSuggestion) {
    setDismissedSuggestions((prev) => new Set(prev).add(suggestionKey(suggestion)));
  }

  function commitHeaderRename() {
    if (!data || editingHeader === null) return;
    const trimmed = editingHeaderValue.trim();
    if (trimmed && trimmed !== data.headers[editingHeader]) {
      commit(renameColumn(data, editingHeader, trimmed), `Rename column to "${trimmed}"`);
    }
    setEditingHeader(null);
  }

  // --- Row actions ---

  function toggleRowSelected(rowIndex: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  function handleSelectAllVisible() {
    if (!data) return;
    setSelectedRows((prev) => (prev.size === data.rows.length ? new Set() : new Set(data.rows.map((_, i) => i))));
  }

  function handleDeleteSelectedRows() {
    if (!data || selectedRows.size === 0) return;
    commit(removeRows(data, [...selectedRows]), `Delete ${selectedRows.size} row(s)`);
  }

  function handleFindDuplicatesClick() {
    if (!data) return;
    const { duplicateIndices } = findDuplicateRows(data);
    setDuplicatePreview(duplicateIndices);
  }

  function handleConfirmRemoveDuplicates() {
    if (!data || !duplicatePreview) return;
    commit(removeRows(data, duplicatePreview), `Remove ${duplicatePreview.length} duplicate row(s)`);
  }

  // --- Global cleaning actions ---

  function handleTrimAll() {
    if (!data) return;
    commit(trimWhitespace(data), 'Trim whitespace (all cells)');
  }

  function handleRemoveEmptyRows() {
    if (!data) return;
    const next = removeEmptyRows(data);
    commit(next, `Remove empty rows (${data.rows.length - next.rows.length})`);
  }

  function handleRemoveEmptyColumns() {
    if (!data) return;
    const next = removeEmptyColumns(data);
    commit(next, `Remove empty columns (${data.headers.length - next.headers.length})`);
  }

  function handlePreviewReplace() {
    if (!data || !findText) return;
    const options: FindReplaceOptions = {
      caseSensitive: findCaseSensitive,
      scope: findScope,
      columnIndex: findScope === 'column' ? findScopeColumn : undefined,
    };
    const result = findAndReplace(data, findText, replaceText, options);
    setReplacePreview({ data: result.data, count: result.replacedCount });
  }

  function handleConfirmReplace() {
    if (!replacePreview) return;
    commit(replacePreview.data, `Replace "${findText}" → "${replaceText}" (${replacePreview.count})`);
    setFindText('');
    setReplaceText('');
  }

  // --- Undo/redo ---

  function handleUndo() {
    setHistory((prev) => (prev ? undo(prev) : prev));
    setSelectedRows(new Set());
  }

  function handleRedo() {
    setHistory((prev) => (prev ? redo(prev) : prev));
    setSelectedRows(new Set());
  }

  // --- Cell editing ---

  function startCellEdit(rowIndex: number, columnIndex: number, currentValue: string) {
    setEditingCell({ row: rowIndex, col: columnIndex });
    setEditingValue(currentValue);
  }

  function commitCellEdit() {
    if (!data || !editingCell) return;
    commit(setCellValue(data, editingCell.row, editingCell.col, editingValue), 'Edit cell');
    setEditingCell(null);
  }

  // --- Export ---

  function handleDownloadCsv() {
    if (!data) return;
    const blob = new Blob([serializeCsvGrid(data)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaned.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadJson() {
    if (!data) return;
    const json = JSON.stringify(gridToJson(data), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaned.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- Virtualization ---

  const rowCount = data?.rows.length ?? 0;
  const totalHeight = rowCount * ROW_HEIGHT;
  const visibleRowSlots = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(rowCount, startIndex + visibleRowSlots);
  const visibleRows = data ? data.rows.slice(startIndex, endIndex) : [];

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <FileDropzone
          onFileSelected={handleFileSelected}
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          hint="A .csv or .tsv file — parsed entirely in your browser, never uploaded."
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="csv-paste" className="text-sm font-medium text-ink dark:text-paper">
            Or paste CSV text
          </label>
          <textarea
            id="csv-paste"
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={'id,name,email\n1,Ada Lovelace,ada@example.com'}
            className="w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <div>
            <Button variant="secondary" size="sm" onClick={handlePasteLoad} disabled={!pasteText.trim() || isLoading}>
              {isLoading ? 'Parsing…' : 'Load pasted data'}
            </Button>
          </div>
        </div>
        {loadError && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {loadError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sizeWarning && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{sizeWarning}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-ink/70 dark:text-paper/70">
        <span>{rowCount.toLocaleString()} rows</span>
        <span>&middot;</span>
        <span>{data.headers.length.toLocaleString()} columns</span>
        <span>&middot;</span>
        <span>{emptyCellCount.toLocaleString()} empty cells</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!canUndo(history!)}>
            Undo{history && canUndo(history) ? `: ${history.present.label}` : ''}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRedo} disabled={!canRedo(history!)}>
            Redo{history && canRedo(history) ? `: ${history.future[0]!.label}` : ''}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleStartOver}>
            Start over
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <Button variant="secondary" size="sm" onClick={handleTrimAll}>
          Trim whitespace (all cells)
        </Button>
        <Button variant="secondary" size="sm" onClick={handleRemoveEmptyRows}>
          Remove empty rows
        </Button>
        <Button variant="secondary" size="sm" onClick={handleRemoveEmptyColumns}>
          Remove empty columns
        </Button>
        {duplicatePreview === null ? (
          <Button variant="secondary" size="sm" onClick={handleFindDuplicatesClick}>
            Remove duplicate rows
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-accent/10 px-2 py-1 text-sm text-ink dark:text-paper">
            <span>
              {duplicatePreview.length === 0
                ? 'No duplicate rows found.'
                : `Found ${duplicatePreview.length.toLocaleString()} duplicate row(s).`}
            </span>
            {duplicatePreview.length > 0 && (
              <Button variant="primary" size="sm" onClick={handleConfirmRemoveDuplicates}>
                Remove
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDuplicatePreview(null)}>
              Cancel
            </Button>
          </div>
        )}
        {selectedRows.size > 0 && (
          <Button variant="secondary" size="sm" onClick={handleDeleteSelectedRows}>
            Delete {selectedRows.size} selected row(s)
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">Find &amp; replace</h3>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="text"
            value={findText}
            onChange={(event) => setFindText(event.target.value)}
            placeholder="Find"
            className="h-9 rounded-md border border-ink/10 bg-paper px-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(event) => setReplaceText(event.target.value)}
            placeholder="Replace with"
            className="h-9 rounded-md border border-ink/10 bg-paper px-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <select
            value={findScope}
            onChange={(event) => setFindScope(event.target.value as 'all' | 'column')}
            className="h-9 rounded-md border border-ink/10 bg-paper px-2 text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            <option value="all">Entire dataset</option>
            <option value="column">Current column only</option>
          </select>
          {findScope === 'column' && (
            <select
              value={findScopeColumn}
              onChange={(event) => setFindScopeColumn(Number(event.target.value))}
              className="h-9 rounded-md border border-ink/10 bg-paper px-2 text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
            >
              {data.headers.map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
          )}
          <label className="flex h-9 items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              checked={findCaseSensitive}
              onChange={(event) => setFindCaseSensitive(event.target.checked)}
              className="accent-accent"
            />
            Case-sensitive
          </label>
          <Button variant="secondary" size="sm" onClick={handlePreviewReplace} disabled={!findText}>
            Preview replace
          </Button>
        </div>
        {replacePreview && (
          <div className="flex items-center gap-2 rounded-md bg-accent/10 px-2 py-1 text-sm text-ink dark:text-paper">
            <span>
              {replacePreview.count === 0
                ? 'No matches found.'
                : `This will replace ${replacePreview.count.toLocaleString()} occurrence(s).`}
            </span>
            {replacePreview.count > 0 && (
              <Button variant="primary" size="sm" onClick={handleConfirmReplace}>
                Apply
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setReplacePreview(null)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestionKey(suggestion)}
              className="flex flex-wrap items-center gap-2 rounded-md bg-accent/10 px-3 py-2 text-sm text-ink dark:text-paper"
            >
              <span>
                <strong>{data.headers[suggestion.columnIndex]}:</strong> {suggestion.message}
              </span>
              <Button variant="primary" size="sm" onClick={() => handleAcceptSuggestion(suggestion)}>
                Fix it
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDismissSuggestion(suggestion)}>
                Dismiss
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-ink/10 dark:border-paper/10" ref={menuRef}>
        <div style={{ width: ROW_NUM_WIDTH + data.headers.length * CELL_WIDTH }}>
          <div
            role="row"
            className="flex border-b border-ink/10 bg-ink/5 dark:border-paper/10 dark:bg-paper/10"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-ink/10 bg-ink/5 dark:border-paper/10 dark:bg-paper/10"
              style={{ width: ROW_NUM_WIDTH }}
            >
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={selectedRows.size === data.rows.length && data.rows.length > 0}
                onChange={handleSelectAllVisible}
                className="accent-accent"
              />
            </div>
            {data.headers.map((header, columnIndex) => (
              <div
                key={columnIndex}
                role="columnheader"
                className="relative flex shrink-0 items-center gap-1 border-r border-ink/10 px-2 dark:border-paper/10"
                style={{ width: CELL_WIDTH }}
              >
                {editingHeader === columnIndex ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingHeaderValue}
                    onChange={(event) => setEditingHeaderValue(event.target.value)}
                    onBlur={commitHeaderRename}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                      if (event.key === 'Escape') setEditingHeader(null);
                    }}
                    className="w-full min-w-0 rounded border border-accent bg-paper px-1 text-sm font-medium text-ink outline-none dark:bg-ink dark:text-paper"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHeader(columnIndex);
                      setEditingHeaderValue(header);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink dark:text-paper"
                    title="Click to rename"
                  >
                    {header}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenColumnMenu((prev) => (prev === columnIndex ? null : columnIndex))}
                  aria-label={`Column actions for ${header}`}
                  aria-expanded={openColumnMenu === columnIndex}
                  className="shrink-0 rounded px-1 text-ink/50 hover:text-accent dark:text-paper/50"
                >
                  &#8942;
                </button>
                {openColumnMenu === columnIndex && (
                  <div className="absolute left-0 top-full z-20 mt-1 flex w-44 flex-col gap-0.5 rounded-md border border-ink/10 bg-paper p-1 shadow-lg dark:border-paper/10 dark:bg-ink">
                    <MenuButton onClick={() => handleSortColumn(columnIndex, 'asc')}>Sort ascending</MenuButton>
                    <MenuButton onClick={() => handleSortColumn(columnIndex, 'desc')}>Sort descending</MenuButton>
                    <MenuButton onClick={() => handleTrimColumn(columnIndex)}>Trim whitespace</MenuButton>
                    <MenuButton onClick={() => handleRemoveColumn(columnIndex)}>Remove column</MenuButton>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            style={{ height: VIEWPORT_HEIGHT, overflowY: 'auto' }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ position: 'absolute', top: startIndex * ROW_HEIGHT, left: 0, right: 0 }}>
                {visibleRows.map((row, offset) => {
                  const rowIndex = startIndex + offset;
                  return (
                    <div
                      key={rowIndex}
                      role="row"
                      className="flex border-b border-ink/5 dark:border-paper/5"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div
                        className="sticky left-0 z-10 flex shrink-0 items-center justify-center gap-1 border-r border-ink/10 bg-paper text-xs text-ink/50 dark:border-paper/10 dark:bg-ink dark:text-paper/50"
                        style={{ width: ROW_NUM_WIDTH }}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select row ${rowIndex + 1}`}
                          checked={selectedRows.has(rowIndex)}
                          onChange={() => toggleRowSelected(rowIndex)}
                          className="accent-accent"
                        />
                        <span>{rowIndex + 1}</span>
                      </div>
                      {data.headers.map((_, columnIndex) => {
                        const isEditing = editingCell?.row === rowIndex && editingCell.col === columnIndex;
                        const value = row[columnIndex] ?? '';
                        return (
                          <div
                            key={columnIndex}
                            role="cell"
                            className="shrink-0 border-r border-ink/5 dark:border-paper/5"
                            style={{ width: CELL_WIDTH }}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingValue}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setEditingValue(event.target.value)}
                                onBlur={commitCellEdit}
                                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                  if (event.key === 'Enter') event.currentTarget.blur();
                                  if (event.key === 'Escape') setEditingCell(null);
                                }}
                                className="h-full w-full border border-accent bg-paper px-2 font-mono text-sm text-ink outline-none dark:bg-ink dark:text-paper"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startCellEdit(rowIndex, columnIndex, value)}
                                className="flex h-full w-full items-center truncate px-2 text-left font-mono text-sm text-ink hover:bg-accent/5 dark:text-paper"
                              >
                                {value}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleDownloadCsv}>
          Download CSV
        </Button>
        <Button variant="secondary" size="sm" onClick={handleDownloadJson}>
          Download JSON
        </Button>
      </div>
    </div>
  );
}

function MenuButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-accent/10 dark:text-paper"
    >
      {children}
    </button>
  );
}
