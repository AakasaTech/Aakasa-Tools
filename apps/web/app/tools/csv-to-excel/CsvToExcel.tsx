'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, FileDropzone } from '@aakasa/ui';
import { csvToJson, type CsvDelimiter, type CsvParseOptions, type CsvToJsonResult } from '@aakasa/csv-utils';
import { buildExcelWorkbook, type CsvDataSet } from './utils/csvToExcel';

interface FileEntry {
  id: number;
  sourceName: string;
  csvText: string;
  sheetName: string;
}

const DELIMITER_LABELS: Record<CsvDelimiter, string> = {
  auto: 'Auto-detect',
  ',': 'Comma (,)',
  ';': 'Semicolon (;)',
  '\t': 'Tab',
  '|': 'Pipe (|)',
};

const PREVIEW_ROW_LIMIT = 8;

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/** Prepends the header row to the parsed data rows, since csvToJson's
 * array-of-arrays output shape returns only data rows — a worksheet needs
 * the header row written in too. */
function toSheetRows(result: CsvToJsonResult): unknown[][] | null {
  if (result.error || !result.stats || !Array.isArray(result.data)) {
    return null;
  }
  return [result.stats.headers, ...(result.data as unknown[][])];
}

/** Strips characters that are invalid in filenames on Windows/macOS/Linux
 * (a user-typed sheet name has no such restriction, so it can't be reused
 * as-is for the download filename). */
function sanitizeFilename(name: string): string {
  const stripped = name.replace(/[<>:"/\\|?*]/g, '').trim();
  return stripped || 'converted';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function CsvToExcel() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [pasteText, setPasteText] = useState('');
  const nextId = useRef(1);

  const [delimiter, setDelimiter] = useState<CsvDelimiter>('auto');
  const [hasHeader, setHasHeader] = useState(true);
  const [inferTypes, setInferTypes] = useState(true);

  const parseOptions: CsvParseOptions = useMemo(
    () => ({ delimiter, hasHeader, outputShape: 'array-of-arrays', typeInference: inferTypes }),
    [delimiter, hasHeader, inferTypes]
  );

  const parsedEntries = useMemo(
    () => entries.map((entry) => ({ entry, result: csvToJson(entry.csvText, parseOptions) })),
    [entries, parseOptions]
  );

  const hasAnyError = parsedEntries.some(({ result }) => Boolean(result.error));
  const canGenerate = parsedEntries.length > 0 && !hasAnyError;
  const isMultiFile = entries.length > 1;

  function addEntries(newEntries: { sourceName: string; csvText: string }[]) {
    setEntries((prev) => [
      ...prev,
      ...newEntries.map(({ sourceName, csvText }) => ({
        id: nextId.current++,
        sourceName,
        csvText,
        sheetName: stripExtension(sourceName).slice(0, 31) || 'Sheet1',
      })),
    ]);
  }

  function handleFilesSelected(files: File[]) {
    void Promise.all(files.map((file) => file.text().then((text) => ({ sourceName: file.name, csvText: text })))).then(
      addEntries
    );
  }

  function handleAddPasted() {
    if (!pasteText.trim()) return;
    const label = `Pasted data${entries.some((e) => e.sourceName.startsWith('Pasted data')) ? ` ${entries.length + 1}` : ''}`;
    addEntries([{ sourceName: label, csvText: pasteText }]);
    setPasteText('');
  }

  function handleRemoveEntry(id: number) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function handleRenameSheet(id: number, name: string) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, sheetName: name } : entry)));
  }

  function handleGenerate() {
    const dataSets: CsvDataSet[] = [];
    for (const { entry, result } of parsedEntries) {
      const rows = toSheetRows(result);
      if (!rows) return;
      dataSets.push({ sheetName: entry.sheetName || 'Sheet1', rows });
    }
    if (dataSets.length === 0) return;

    const blob = buildExcelWorkbook(dataSets, { inferTypes });
    const filename = dataSets.length === 1 ? `${sanitizeFilename(dataSets[0]!.sheetName)}.xlsx` : 'workbook.xlsx';
    downloadBlob(blob, filename);
  }

  const totalRows = parsedEntries.reduce((sum, { result }) => sum + (result.stats?.rowCount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        onFilesSelected={handleFilesSelected}
        multiple
        accept=".csv,text/csv"
        label="Drop one or more .csv files here, or click to browse"
        hint="Each file becomes its own sheet in the downloaded workbook — parsed entirely in your browser, never uploaded."
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="csv-to-excel-paste" className="text-sm font-medium text-ink dark:text-paper">
          Or paste CSV text
        </label>
        <textarea
          id="csv-to-excel-paste"
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          rows={5}
          spellCheck={false}
          placeholder={'id,name,email\n1,Ada Lovelace,ada@example.com'}
          className="w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
        <div>
          <Button variant="secondary" size="sm" onClick={handleAddPasted} disabled={!pasteText.trim()}>
            Add pasted data as a sheet
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <OptionField label="Delimiter">
          <select
            value={delimiter}
            onChange={(event) => setDelimiter(event.target.value as CsvDelimiter)}
            className="h-9 rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
          >
            {(Object.keys(DELIMITER_LABELS) as CsvDelimiter[]).map((value) => (
              <option key={value} value={value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {DELIMITER_LABELS[value]}
              </option>
            ))}
          </select>
        </OptionField>

        <label className="flex h-9 items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(event) => setHasHeader(event.target.checked)}
            className="accent-accent"
          />
          First row is header
        </label>

        <div className="flex flex-col gap-0.5">
          <label className="flex h-9 items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              checked={inferTypes}
              onChange={(event) => setInferTypes(event.target.checked)}
              className="accent-accent"
            />
            Infer types (numbers/booleans become real Excel cells)
          </label>
          {inferTypes && (
            <span className="text-xs text-ink/40 dark:text-paper/40">
              Off keeps every cell text — safer for IDs like &quot;0042&quot; that would lose leading zeros.
            </span>
          )}
        </div>
      </div>

      {parsedEntries.length > 0 && (
        <div className="flex flex-col gap-4">
          {isMultiFile && (
            <p className="text-xs text-ink/50 dark:text-paper/50">
              Sheets are auto-named from each file — rename them after downloading by double-clicking a sheet tab in
              Excel.
            </p>
          )}

          {parsedEntries.map(({ entry, result }) => (
            <div key={entry.id} className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
              <div className="flex flex-wrap items-center gap-2">
                {!isMultiFile ? (
                  <label className="flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70">
                    Sheet name
                    <input
                      type="text"
                      value={entry.sheetName}
                      onChange={(event) => handleRenameSheet(entry.id, event.target.value)}
                      spellCheck={false}
                      className="h-8 rounded-md border border-ink/10 bg-paper px-2 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                    />
                  </label>
                ) : (
                  <span className="text-sm font-medium text-ink dark:text-paper">{entry.sheetName}</span>
                )}
                <span className="text-xs text-ink/40 dark:text-paper/40">from {entry.sourceName}</span>
                {result.stats && (
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    {result.stats.rowCount.toLocaleString()} rows &middot; {result.stats.columnCount.toLocaleString()}{' '}
                    columns
                  </span>
                )}
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => handleRemoveEntry(entry.id)}>
                  Remove
                </Button>
              </div>

              {result.error ? (
                <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                  {result.error}
                </p>
              ) : (
                <PreviewTable result={result} />
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink/70 dark:text-paper/70">
              {parsedEntries.length} sheet{parsedEntries.length === 1 ? '' : 's'} &middot; {totalRows.toLocaleString()}{' '}
              total rows
            </span>
            <Button variant="primary" onClick={handleGenerate} disabled={!canGenerate}>
              Generate &amp; Download .xlsx
            </Button>
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Everything runs locally in your browser — files are never uploaded anywhere.
      </span>
    </div>
  );
}

function PreviewTable({ result }: { result: CsvToJsonResult }) {
  if (!result.stats || !Array.isArray(result.data)) return null;
  const rows = (result.data as unknown[][]).slice(0, PREVIEW_ROW_LIMIT);

  return (
    <div className="overflow-x-auto rounded-md border border-ink/10 dark:border-paper/10">
      <table className="w-full min-w-max border-collapse text-left text-xs">
        <thead>
          <tr className="bg-ink/5 dark:bg-paper/10">
            {result.stats.headers.map((header, index) => (
              <th key={index} className="border-b border-ink/10 px-2 py-1.5 font-medium text-ink dark:border-paper/10 dark:text-paper">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-ink/5 last:border-b-0 dark:border-paper/5">
              {result.stats!.headers.map((_, columnIndex) => (
                <td key={columnIndex} className="whitespace-nowrap px-2 py-1.5 font-mono text-ink/80 dark:text-paper/80">
                  {String(row[columnIndex] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.stats.rowCount > PREVIEW_ROW_LIMIT && (
        <p className="border-t border-ink/10 px-2 py-1 text-xs text-ink/40 dark:border-paper/10 dark:text-paper/40">
          Showing first {PREVIEW_ROW_LIMIT} of {result.stats.rowCount.toLocaleString()} rows.
        </p>
      )}
    </div>
  );
}

function OptionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink/70 dark:text-paper/70">{label}</span>
      {children}
    </div>
  );
}
