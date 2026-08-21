'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BulkList, Button, Checkbox, CopyButton, FileDropzone } from '@aakasa/ui';
import { generateUuidV4, type UuidOptions } from './utils/generateUuid';
import { computeHash, HASH_ALGORITHMS, isSecureAlgorithm, type HashAlgorithm } from './utils/hash';
import type { HashWorkerRequest, HashWorkerResponse } from './workers/hash.worker';

const BULK_COUNT = 10;
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

export function UuidHashGenerator() {
  return (
    <div className="flex flex-col gap-10">
      <UuidSection />
      <hr className="border-ink/10 dark:border-paper/10" />
      <HashSection />
    </div>
  );
}

function UuidSection() {
  const [options, setOptions] = useState<UuidOptions>({ hyphens: true, uppercase: false });
  const [uuid, setUuid] = useState('');
  const [bulkUuids, setBulkUuids] = useState<string[]>([]);

  const regenerate = useCallback(() => {
    setUuid(generateUuidV4(options));
  }, [options]);

  // Generates on mount, and again whenever the format toggles change.
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  function handleGenerateBulk() {
    setBulkUuids(Array.from({ length: BULK_COUNT }, () => generateUuidV4(options)));
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-ink dark:text-paper">UUID Generator</h2>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={uuid}
            aria-label="Generated UUID"
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-lg text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={uuid} size="md" />
        </div>
        <p className="text-xs text-ink/40 dark:text-paper/40">
          UUID v4 (randomly generated) — not v1 (timestamp-based) or v5 (namespace-based).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Checkbox
          label="With hyphens"
          checked={options.hyphens}
          onChange={(event) => setOptions((prev) => ({ ...prev, hyphens: event.target.checked }))}
        />
        <Checkbox
          label="Uppercase"
          checked={options.uppercase}
          onChange={(event) => setOptions((prev) => ({ ...prev, uppercase: event.target.checked }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={regenerate}>Generate new UUID</Button>
        <Button variant="secondary" size="sm" onClick={handleGenerateBulk}>
          Generate {BULK_COUNT} UUIDs
        </Button>
      </div>

      <BulkList items={bulkUuids} />
    </section>
  );
}

type HashSource = 'text' | 'file';

function HashSection() {
  const [source, setSource] = useState<HashSource>('text');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [textInput, setTextInput] = useState('');
  const [hashOutput, setHashOutput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);

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
    [getWorker]
  );

  // Text mode: debounced live hashing.
  useEffect(() => {
    if (source !== 'text') {
      return;
    }
    if (!textInput) {
      setHashOutput('');
      return;
    }
    const timer = setTimeout(() => {
      void computeHash(textInput, algorithm).then(setHashOutput);
    }, 200);
    return () => clearTimeout(timer);
  }, [source, textInput, algorithm]);

  const hashFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File is too large (${formatBytes(file.size)}). Max size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
        setHashOutput('');
        return;
      }
      setFileError(null);
      setIsHashing(true);
      try {
        const buffer = await file.arrayBuffer();
        const hash =
          file.size > WORKER_THRESHOLD_BYTES ? await hashInWorker(buffer, algorithm) : await computeHash(buffer, algorithm);
        setHashOutput(hash);
      } finally {
        setIsHashing(false);
      }
    },
    [algorithm, hashInWorker]
  );

  // File mode: (re)hash whenever a new file is picked, or the algorithm changes.
  useEffect(() => {
    if (source === 'file' && selectedFile) {
      void hashFile(selectedFile);
    }
  }, [source, selectedFile, hashFile]);

  function handleSourceChange(next: HashSource) {
    setSource(next);
    setHashOutput('');
    setFileError(null);
  }

  function handleFileSelected(file: File) {
    setSelectedFile(file);
  }

  const algorithmWarning = useMemo(
    () => (!isSecureAlgorithm(algorithm) ? 'MD5 is not cryptographically secure — use only for checksums, never for passwords or security purposes.' : null),
    [algorithm]
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-ink dark:text-paper">Hash Generator</h2>

      <div className="flex gap-2">
        <Button variant={source === 'text' ? 'primary' : 'secondary'} size="sm" onClick={() => handleSourceChange('text')}>
          Text
        </Button>
        <Button variant={source === 'file' ? 'primary' : 'secondary'} size="sm" onClick={() => handleSourceChange('file')}>
          File
        </Button>
      </div>

      {source === 'text' ? (
        <textarea
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          spellCheck={false}
          placeholder="Type or paste text to hash…"
          aria-label="Text to hash"
          className="h-32 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <FileDropzone
            onFileSelected={handleFileSelected}
            hint={`Max ${formatBytes(MAX_FILE_SIZE_BYTES)} — hashed entirely in your browser, never uploaded.`}
          />
          {selectedFile && (
            <p className="text-sm text-ink/70 dark:text-paper/70">
              {selectedFile.name} · {formatBytes(selectedFile.size)}
            </p>
          )}
          {fileError && (
            <p role="alert" className="text-xs text-danger">
              {fileError}
            </p>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/70">
        Algorithm
        <select
          value={algorithm}
          onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}
          className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
        >
          {HASH_ALGORITHMS.map((alg) => (
            <option key={alg} value={alg}>
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
          <span>{isHashing ? 'Hashing…' : 'Hash'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={hashOutput}
            placeholder="Hash will appear here…"
            aria-label="Computed hash"
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 w-full flex-1 rounded-md border border-ink/10 bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={hashOutput} size="md" disabled={!hashOutput} />
        </div>
      </div>
    </section>
  );
}
