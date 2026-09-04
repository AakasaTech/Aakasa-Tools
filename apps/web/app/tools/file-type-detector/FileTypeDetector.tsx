'use client';

import { useState } from 'react';
import { Button, CopyButton, FileDropzone } from '@aakasa/ui';
import { detectType, type FileTypeResult } from './utils/detectFileType';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

interface FileRow {
  id: string;
  file: File;
  result: FileTypeResult | null;
  isDetecting: boolean;
  error: string | null;
}

let nextRowId = 0;

export function FileTypeDetector() {
  const [rows, setRows] = useState<FileRow[]>([]);

  function handleFilesSelected(files: File[]) {
    const newRows: FileRow[] = files.map((file) => ({
      id: `row-${(nextRowId += 1)}`,
      file,
      result: null,
      isDetecting: true,
      error: null,
    }));
    setRows((prev) => [...prev, ...newRows]);

    newRows.forEach((row) => {
      detectType(row.file)
        .then((result) => {
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, result, isDetecting: false } : r)));
        })
        .catch(() => {
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isDetecting: false, error: 'Could not read this file.' } : r)));
        });
    });
  }

  function handleRemoveRow(rowId: string) {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  }

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        hint="Any file type, read entirely in your browser, never uploaded."
      />

      {rows.length === 0 ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Drop one or more files above to detect their true type by content.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <FileTypeRow key={row.id} row={row} onRemove={handleRemoveRow} />
          ))}
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you drop here is uploaded or stored.</span>
    </div>
  );
}

function FileTypeRow({ row, onRemove }: { row: FileRow; onRemove: (rowId: string) => void }) {
  const [showRawBytes, setShowRawBytes] = useState(false);
  const { result } = row;
  const isMismatch = result?.matches === false;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border-y border-r border-l-2 p-4 ${
        isMismatch ? 'border-l-danger border-ink/10 bg-danger/5 dark:border-paper/10' : 'border-l-transparent border-ink/10 dark:border-paper/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm text-ink dark:text-paper">
          {row.file.name} <span className="text-ink/50 dark:text-paper/50">· {formatBytes(row.file.size)}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={() => onRemove(row.id)} aria-label={`Remove ${row.file.name}`}>
          Remove
        </Button>
      </div>

      {row.isDetecting && <p className="text-sm text-ink/50 dark:text-paper/50">Detecting…</p>}

      {row.error && (
        <p role="alert" className="text-xs text-danger">
          {row.error}
        </p>
      )}

      {result && !result.detectedMime && (
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Could not determine file type by content — this is common for plain text and some other formats with no distinct binary signature.
        </p>
      )}

      {result && result.detectedMime && (
        <>
          {isMismatch && (
            <div className="rounded-md border-l-2 border-l-danger bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              This file is named .{result.claimedExtension || '(no extension)'} but is actually a {result.detectedExtension?.toUpperCase()} file
              ({result.detectedMime}).
            </div>
          )}
          {result.matches === true && (
            <div className="rounded-md border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-ink/70 dark:border-paper/10 dark:bg-paper/5 dark:text-paper/70">
              Confirmed — the file extension matches its detected content.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">Detected type</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink dark:text-paper">
                  {result.detectedMime} (.{result.detectedExtension})
                </span>
                <CopyButton value={result.detectedMime} size="sm" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">Claimed extension</span>
              <span className="font-mono text-ink dark:text-paper">{result.claimedExtension ? `.${result.claimedExtension}` : '(none)'}</span>
            </div>
          </div>

          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowRawBytes((v) => !v)}>
              {showRawBytes ? 'Hide' : 'Show'} raw magic bytes
            </Button>
            {showRawBytes && (
              <pre className="mt-1.5 overflow-x-auto rounded-md border border-ink/10 bg-ink/5 p-2 font-mono text-xs text-ink/80 dark:border-paper/10 dark:bg-paper/5 dark:text-paper/80">
                {result.rawBytesHex}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
