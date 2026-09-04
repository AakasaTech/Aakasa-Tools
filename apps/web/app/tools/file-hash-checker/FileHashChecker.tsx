'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CopyButton, FileDropzone } from '@aakasa/ui';
import { computeHash, HASH_ALGORITHMS, isSecureAlgorithm, type HashAlgorithm } from '../uuid-hash-generator/utils/hash';
import { detectLikelyAlgorithmMismatch, normalizeHashForComparison } from './utils/compareHash';
import type { HashWorkerRequest, HashWorkerResponse } from './workers/hash.worker';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const WORKER_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10MB

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
  computedHash: string;
  isHashing: boolean;
  error: string | null;
  expectedHashInput: string;
}

let nextRowId = 0;

export function FileHashChecker() {
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [rows, setRows] = useState<FileRow[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map<number, (response: HashWorkerResponse) => void>());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./workers/hash.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<HashWorkerResponse>) => {
        const resolve = pendingRequestsRef.current.get(event.data.id);
        if (resolve) {
          resolve(event.data);
          pendingRequestsRef.current.delete(event.data.id);
        }
      };
      workerRef.current = worker;
    }
    return workerRef.current;
  }, []);

  const hashInWorker = useCallback(
    (buffer: ArrayBuffer, alg: HashAlgorithm): Promise<string> => {
      const worker = getWorker();
      const id = (requestIdRef.current += 1);
      return new Promise((resolve) => {
        pendingRequestsRef.current.set(id, (response) => resolve(response.hash));
        const request: HashWorkerRequest = { id, buffer, algorithm: alg };
        worker.postMessage(request, [buffer]);
      });
    },
    [getWorker],
  );

  const hashRow = useCallback(
    async (rowId: string, file: File, alg: HashAlgorithm) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === rowId ? { ...row, isHashing: false, error: `File is too large (${formatBytes(file.size)}). Max size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`, computedHash: '' } : row,
          ),
        );
        return;
      }
      try {
        const buffer = await file.arrayBuffer();
        const hash = file.size > WORKER_THRESHOLD_BYTES ? await hashInWorker(buffer, alg) : await computeHash(buffer, alg);
        setRows((prev) => (prev.some((row) => row.id === rowId) ? prev.map((row) => (row.id === rowId ? { ...row, computedHash: hash, isHashing: false, error: null } : row)) : prev));
      } catch {
        setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, isHashing: false, error: 'Could not hash this file.' } : row)));
      }
    },
    [hashInWorker],
  );

  function handleFilesSelected(files: File[]) {
    const newRows: FileRow[] = files.map((file) => ({
      id: `row-${(nextRowId += 1)}`,
      file,
      computedHash: '',
      isHashing: true,
      error: null,
      expectedHashInput: '',
    }));
    setRows((prev) => [...prev, ...newRows]);
    newRows.forEach((row) => void hashRow(row.id, row.file, algorithm));
  }

  function handleAlgorithmChange(nextAlgorithm: HashAlgorithm) {
    setAlgorithm(nextAlgorithm);
    setRows((prev) => prev.map((row) => ({ ...row, isHashing: true, computedHash: '', error: null })));
    rows.forEach((row) => void hashRow(row.id, row.file, nextAlgorithm));
  }

  function handleExpectedHashChange(rowId: string, value: string) {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, expectedHashInput: value } : row)));
  }

  function handleRemoveRow(rowId: string) {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  }

  const algorithmWarning = !isSecureAlgorithm(algorithm)
    ? 'MD5 is not cryptographically secure — fine for basic corruption checks, not for verifying a file hasn’t been tampered with by a determined attacker.'
    : null;

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone
        multiple
        onFilesSelected={handleFilesSelected}
        hint={`Any file type, checked entirely in your browser, never uploaded. Max ${formatBytes(MAX_FILE_SIZE_BYTES)} per file.`}
      />

      <label className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/70">
        Algorithm
        <select
          value={algorithm}
          onChange={(event) => handleAlgorithmChange(event.target.value as HashAlgorithm)}
          className="rounded-md border border-ink/15 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        >
          {HASH_ALGORITHMS.map((alg) => (
            <option key={alg} value={alg} className="bg-paper text-ink dark:bg-ink dark:text-paper">
              {isSecureAlgorithm(alg) ? alg : `${alg} (not cryptographically secure)`}
            </option>
          ))}
        </select>
      </label>
      {algorithmWarning && (
        <p role="alert" className="text-xs text-danger">
          {algorithmWarning}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Drop one or more files above to compute their hashes.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <FileHashRow key={row.id} row={row} algorithm={algorithm} onExpectedHashChange={handleExpectedHashChange} onRemove={handleRemoveRow} />
          ))}
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Files are hashed entirely in your browser — nothing is uploaded anywhere, which matters if you&apos;re verifying something sensitive.
      </span>
    </div>
  );
}

function FileHashRow({
  row,
  algorithm,
  onExpectedHashChange,
  onRemove,
}: {
  row: FileRow;
  algorithm: HashAlgorithm;
  onExpectedHashChange: (rowId: string, value: string) => void;
  onRemove: (rowId: string) => void;
}) {
  const normalizedComputed = normalizeHashForComparison(row.computedHash);
  const normalizedExpected = normalizeHashForComparison(row.expectedHashInput);
  const hasExpected = normalizedExpected.length > 0;
  const isMatch = hasExpected && !!row.computedHash && normalizedComputed === normalizedExpected;
  const mismatchSuggestion = hasExpected && !isMatch ? detectLikelyAlgorithmMismatch(row.expectedHashInput, algorithm) : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm text-ink dark:text-paper">
          {row.file.name} <span className="text-ink/50 dark:text-paper/50">· {formatBytes(row.file.size)}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={() => onRemove(row.id)} aria-label={`Remove ${row.file.name}`}>
          Remove
        </Button>
      </div>

      {row.error && (
        <p role="alert" className="text-xs text-danger">
          {row.error}
        </p>
      )}

      {!row.error && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={row.isHashing ? 'Hashing…' : row.computedHash}
            aria-label={`Computed hash for ${row.file.name}`}
            onFocus={(event) => event.currentTarget.select()}
            className="h-10 w-full flex-1 rounded-md border border-ink/15 bg-paper px-3 font-mono text-xs text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={row.computedHash} size="sm" disabled={!row.computedHash} />
        </div>
      )}

      <label className="flex flex-col gap-1 text-xs text-ink/60 dark:text-paper/60">
        Expected hash
        <input
          type="text"
          value={row.expectedHashInput}
          onChange={(event) => onExpectedHashChange(row.id, event.target.value)}
          placeholder="Paste the hash you're checking against…"
          spellCheck={false}
          className="h-10 w-full rounded-md border border-ink/15 bg-paper px-3 font-mono text-xs text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      {hasExpected && row.computedHash && (
        <div
          className={`rounded-md border-y border-r border-l-2 px-3 py-2 text-sm font-semibold ${
            isMatch
              ? 'border-l-success border-ink/10 bg-success/10 text-success dark:border-paper/10'
              : 'border-l-danger border-ink/10 bg-danger/10 text-danger dark:border-paper/10'
          }`}
        >
          {isMatch ? 'MATCH' : 'NO MATCH'}
        </div>
      )}

      {mismatchSuggestion && (
        <p className="text-xs text-ink/60 dark:text-paper/60">
          This looks like it might be a <span className="font-mono font-semibold">{mismatchSuggestion}</span> hash ({normalizedExpected.length}{' '}
          characters) rather than {algorithm} — try selecting {mismatchSuggestion} above instead of assuming the file is wrong.
        </p>
      )}
    </div>
  );
}
