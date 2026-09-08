'use client';

import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button, FileDropzone } from '@aakasa/ui';
import { parseAnyFormat, renameColumns, type ParsedFile, type Row } from './utils/parseAnyFormat';
import { joinOnKey, stackRows } from './utils/mergeStrategies';

interface UploadedFile {
  id: number;
  fileName: string;
  parsed: ParsedFile;
  /** Original column name -> user-typed rename. Blank/absent entries mean "keep the original name." */
  renames: Record<string, string>;
}

type MergeMode = 'stack' | 'join';
type JoinType = 'inner' | 'left';

const PREVIEW_ROW_LIMIT = 20;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function intersectColumns(columnSets: string[][]): string[] {
  if (columnSets.length === 0) return [];
  return columnSets.reduce((acc, cols) => acc.filter((col) => cols.includes(col)));
}

export function DataMerger() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState<MergeMode>('stack');
  const [joinColumn, setJoinColumn] = useState('');
  const [joinType, setJoinType] = useState<JoinType>('left');
  const nextId = useRef(1);

  function handleFilesSelected(selected: File[]) {
    void Promise.all(
      selected.map((file) => file.text().then((text) => ({ fileName: file.name, text })))
    ).then((entries) => {
      setFiles((prev) => [
        ...prev,
        ...entries.map(({ fileName, text }) => ({
          id: nextId.current++,
          fileName,
          parsed: parseAnyFormat(fileName, text),
          renames: {},
        })),
      ]);
    });
  }

  function removeFile(id: number) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function updateRename(fileId: number, originalColumn: string, newName: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, renames: { ...f.renames, [originalColumn]: newName } } : f))
    );
  }

  const validFiles = files.filter((f) => !f.parsed.error);

  const renamedDatasets: Row[][] = useMemo(
    () => validFiles.map((f) => renameColumns(f.parsed.rows, f.renames)),
    [validFiles]
  );

  const renamedColumnSets: string[][] = useMemo(
    () =>
      validFiles.map((f) => f.parsed.columns.map((col) => f.renames[col]?.trim() || col)),
    [validFiles]
  );

  const commonColumns = useMemo(() => intersectColumns(renamedColumnSets), [renamedColumnSets]);
  const effectiveJoinColumn = commonColumns.includes(joinColumn) ? joinColumn : (commonColumns[0] ?? '');

  const canMerge = validFiles.length > 0 && (mode === 'stack' || (mode === 'join' && effectiveJoinColumn !== ''));

  const stackResult = useMemo(
    () => (canMerge && mode === 'stack' ? stackRows(renamedDatasets) : null),
    [canMerge, mode, renamedDatasets]
  );
  const joinResult = useMemo(
    () => (canMerge && mode === 'join' ? joinOnKey(renamedDatasets, effectiveJoinColumn, joinType) : null),
    [canMerge, mode, renamedDatasets, effectiveJoinColumn, joinType]
  );

  const merged: Row[] = stackResult?.merged ?? joinResult?.merged ?? [];
  const mergedColumns = merged.length > 0 ? Object.keys(merged[0]!) : [];

  function handleDownloadCsv() {
    if (merged.length === 0) return;
    const csvText = Papa.unparse({ fields: mergedColumns, data: merged.map((row) => mergedColumns.map((col) => row[col])) });
    downloadBlob(new Blob([csvText], { type: 'text/csv' }), 'merged.csv');
  }

  function handleDownloadJson() {
    if (merged.length === 0) return;
    downloadBlob(new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' }), 'merged.json');
  }

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        onFilesSelected={handleFilesSelected}
        multiple
        accept=".csv,.json,text/csv,application/json"
        label="Drop two or more .csv or .json files here, or click to browse"
        hint="Mixed file types are fine — each is parsed by its own format, then merged as one dataset. Parsed entirely in your browser, never uploaded."
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          {files.map((file) => (
            <div key={file.id} className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink dark:text-paper">{file.fileName}</span>
                {!file.parsed.error && (
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    {file.parsed.rows.length.toLocaleString()} rows &middot; {file.parsed.columns.length} columns
                  </span>
                )}
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => removeFile(file.id)}>
                  Remove
                </Button>
              </div>

              {file.parsed.error ? (
                <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                  {file.parsed.error}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-ink/50 dark:text-paper/50">
                    Rename columns before merging (optional — leave blank to keep the original name):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {file.parsed.columns.map((col) => (
                      <label key={col} className="flex items-center gap-1 text-xs text-ink/70 dark:text-paper/70">
                        {col} →
                        <input
                          type="text"
                          value={file.renames[col] ?? ''}
                          placeholder={col}
                          onChange={(event) => updateRename(file.id, col, event.target.value)}
                          className="h-7 w-32 rounded border border-ink/15 bg-paper px-2 font-mono text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {validFiles.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
          <div className="flex gap-1.5">
            <Button variant={mode === 'stack' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('stack')}>
              Stack rows
            </Button>
            <Button variant={mode === 'join' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('join')}>
              Join on key
            </Button>
          </div>

          {mode === 'stack' ? (
            <p className="text-xs text-ink/50 dark:text-paper/50">
              Combines every file&apos;s rows into one list. Columns that aren&apos;t present in every file are still
              included — those rows just get an empty cell for the columns their source file didn&apos;t have.
            </p>
          ) : commonColumns.length === 0 ? (
            <p className="text-xs text-danger">
              No column name is common to all uploaded files, so there&apos;s nothing to join on — rename columns above
              so at least one matches across files, or use Stack rows instead.
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-ink/70 dark:text-paper/70">
                Join column
                <select
                  value={effectiveJoinColumn}
                  onChange={(event) => setJoinColumn(event.target.value)}
                  className="h-8 rounded-md border border-ink/15 bg-paper px-2 text-xs text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
                >
                  {commonColumns.map((col) => (
                    <option key={col} value={col} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                      {col}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-ink/70 dark:text-paper/70">Join type</span>
                <div className="flex gap-1.5">
                  <Button variant={joinType === 'left' ? 'primary' : 'secondary'} size="sm" onClick={() => setJoinType('left')}>
                    Left join
                  </Button>
                  <Button variant={joinType === 'inner' ? 'primary' : 'secondary'} size="sm" onClick={() => setJoinType('inner')}>
                    Inner join
                  </Button>
                </div>
              </div>
              <p className="max-w-sm text-xs text-ink/40 dark:text-paper/40">
                {joinType === 'left'
                  ? `Keeps every row from "${validFiles[0]?.fileName ?? 'the first file'}", filling in matches from the other files where the ${effectiveJoinColumn} value lines up, and leaving the rest empty.`
                  : `Keeps only rows whose ${effectiveJoinColumn} value is present in every uploaded file.`}
              </p>
            </div>
          )}
        </div>
      )}

      {merged.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink/70 dark:text-paper/70">
            <span>{merged.length.toLocaleString()} merged rows</span>
            <span>&middot;</span>
            <span>{mergedColumns.length} columns</span>
            {joinResult && (
              <>
                <span>&middot;</span>
                <span>
                  {joinResult.matchStats.matchedInAll.toLocaleString()} of {joinResult.matchStats.primaryRowCount.toLocaleString()}{' '}
                  primary rows matched in every file
                </span>
              </>
            )}
          </div>

          {stackResult && stackResult.columnSummary.some((c) => c.missingFromDatasets.length > 0) && (
            <div className="rounded-md bg-accent/10 px-3 py-2 text-xs text-ink dark:text-paper">
              <p className="font-medium">Some columns weren&apos;t present in every file:</p>
              <ul className="mt-1 list-disc pl-4">
                {stackResult.columnSummary
                  .filter((c) => c.missingFromDatasets.length > 0)
                  .map((c) => (
                    <li key={c.column}>
                      <strong>{c.column}</strong> — missing from{' '}
                      {c.missingFromDatasets.map((i) => validFiles[i]?.fileName ?? `file ${i + 1}`).join(', ')}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-ink/10 dark:border-paper/10">
            <table className="w-full min-w-max border-collapse text-left text-xs">
              <thead>
                <tr className="bg-ink/5 dark:bg-paper/10">
                  {mergedColumns.map((col) => (
                    <th key={col} className="whitespace-nowrap border-b border-ink/10 px-2 py-1.5 font-medium text-ink dark:border-paper/10 dark:text-paper">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {merged.slice(0, PREVIEW_ROW_LIMIT).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-ink/5 last:border-b-0 dark:border-paper/5">
                    {mergedColumns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-2 py-1.5 font-mono text-ink/80 dark:text-paper/80">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {merged.length > PREVIEW_ROW_LIMIT && (
              <p className="border-t border-ink/10 px-2 py-1 text-xs text-ink/40 dark:border-paper/10 dark:text-paper/40">
                Showing first {PREVIEW_ROW_LIMIT} of {merged.length.toLocaleString()} rows.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadCsv}>
              Download merged .csv
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadJson}>
              Download merged .json
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
