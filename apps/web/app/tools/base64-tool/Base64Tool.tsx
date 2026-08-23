'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CopyButton, FileDropzone } from '@aakasa/ui';
import { Base64DecodeError, decodeText, encodeFile, encodeText } from './utils/base64';
import type { EncodeWorkerRequest, EncodeWorkerResponse } from './workers/encode.worker';

const WORKER_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10MB
const LARGE_FILE_WARNING_BYTES = 25 * 1024 * 1024; // 25MB

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

/**
 * Encodes a file to Base64, transparently routing through a Web Worker for
 * files above WORKER_THRESHOLD_BYTES so a large file doesn't freeze the tab.
 * Shared by both the File tab and the Image tab so neither duplicates the
 * worker wiring.
 */
function useFileEncoder() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map<number, (response: EncodeWorkerResponse) => void>());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./workers/encode.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<EncodeWorkerResponse>) => {
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

  const encodeInWorker = useCallback(
    (file: File): Promise<EncodeWorkerResponse> => {
      const worker = getWorker();
      const id = (requestIdRef.current += 1);
      return new Promise((resolve) => {
        pendingRequestsRef.current.set(id, resolve);
        const request: EncodeWorkerRequest = { id, file };
        worker.postMessage(request);
      });
    },
    [getWorker]
  );

  return useCallback(
    async (file: File): Promise<string> => {
      if (file.size <= WORKER_THRESHOLD_BYTES) {
        return encodeFile(file);
      }
      const response = await encodeInWorker(file);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.result;
    },
    [encodeInWorker]
  );
}

type Tab = 'text' | 'file' | 'image';

export function Base64Tool() {
  const [tab, setTab] = useState<Tab>('text');
  const encodeFileToBase64 = useFileEncoder();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={tab === 'text' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('text')}>
          Text
        </Button>
        <Button variant={tab === 'file' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('file')}>
          File
        </Button>
        <Button variant={tab === 'image' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('image')}>
          Image &rarr; Data URI
        </Button>
      </div>

      {tab === 'text' && <TextTab />}
      {tab === 'file' && <FileTab encodeFileToBase64={encodeFileToBase64} />}
      {tab === 'image' && <ImageTab encodeFileToBase64={encodeFileToBase64} />}
    </div>
  );
}

type TextMode = 'encode' | 'decode';

function TextTab() {
  const [mode, setMode] = useState<TextMode>('encode');
  const [plainText, setPlainText] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Encode direction: plain text is the source, Base64 is derived.
  useEffect(() => {
    if (mode !== 'encode') {
      return;
    }
    setBase64Text(plainText ? encodeText(plainText) : '');
    setDecodeError(null);
  }, [mode, plainText]);

  // Decode direction: Base64 is the source, plain text is derived.
  useEffect(() => {
    if (mode !== 'decode') {
      return;
    }
    if (!base64Text) {
      setPlainText('');
      setDecodeError(null);
      return;
    }
    try {
      setPlainText(decodeText(base64Text));
      setDecodeError(null);
    } catch (err) {
      setDecodeError(err instanceof Base64DecodeError ? err.message : 'Invalid Base64 string');
      setPlainText('');
    }
  }, [mode, base64Text]);

  function handleSwap() {
    setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={mode === 'encode' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('encode')}>
          Encode
        </Button>
        <Button variant={mode === 'decode' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('decode')}>
          Decode
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSwap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          Swap
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Plain text</span>
          <textarea
            value={plainText}
            onChange={(event) => setPlainText(event.target.value)}
            readOnly={mode === 'decode'}
            spellCheck={false}
            placeholder="Type text to encode…"
            aria-label="Plain text"
            className="h-56 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <CopyButton value={plainText} disabled={!plainText} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink/50 dark:text-paper/50">Base64</span>
          <textarea
            value={base64Text}
            onChange={(event) => setBase64Text(event.target.value)}
            readOnly={mode === 'encode'}
            spellCheck={false}
            placeholder="Paste Base64 to decode…"
            aria-label="Base64"
            className="h-56 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          {decodeError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {decodeError}
            </p>
          )}
          <CopyButton value={base64Text} disabled={!base64Text} />
        </div>
      </div>
    </div>
  );
}

interface FileTabProps {
  encodeFileToBase64: (file: File) => Promise<string>;
}

function FileTab({ encodeFileToBase64 }: FileTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encode = useCallback(
    async (nextFile: File) => {
      setError(null);
      setIsEncoding(true);
      try {
        setOutput(await encodeFileToBase64(nextFile));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read this file.');
        setOutput('');
      } finally {
        setIsEncoding(false);
      }
    },
    [encodeFileToBase64]
  );

  useEffect(() => {
    if (file) {
      void encode(file);
    }
  }, [file, encode]);

  function handleDownload() {
    if (!output) {
      return;
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name ?? 'encoded'}.base64.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <FileDropzone
        onFileSelected={setFile}
        hint="Any file type — encoded entirely in your browser, never uploaded."
      />

      {file && (
        <div className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
          <span>
            {file.name} &middot; {formatBytes(file.size)} &middot; {file.type || 'unknown type'}
          </span>
          {file.size > LARGE_FILE_WARNING_BYTES && (
            <span className="text-xs text-danger">
              This file is large ({formatBytes(file.size)}) — encoding and copying may be slow.
            </span>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">{isEncoding ? 'Encoding…' : 'Base64 output'}</span>
        <textarea
          value={output}
          readOnly
          spellCheck={false}
          placeholder="Base64 will appear here…"
          aria-label="Base64 output"
          className="h-48 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
        <div className="flex items-center gap-2">
          <CopyButton value={output} disabled={!output} />
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
            Download as .txt
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ImageTabProps {
  encodeFileToBase64: (file: File) => Promise<string>;
}

function ImageTab({ encodeFileToBase64 }: ImageTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encode = useCallback(
    async (nextFile: File) => {
      if (!nextFile.type.startsWith('image/')) {
        setError('Please select an image file.');
        setDataUri('');
        return;
      }
      setError(null);
      setIsEncoding(true);
      try {
        const base64 = await encodeFileToBase64(nextFile);
        setDataUri(`data:${nextFile.type};base64,${base64}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read this image.');
        setDataUri('');
      } finally {
        setIsEncoding(false);
      }
    },
    [encodeFileToBase64]
  );

  useEffect(() => {
    if (file) {
      void encode(file);
    }
  }, [file, encode]);

  return (
    <div className="flex flex-col gap-3">
      <FileDropzone
        onFileSelected={setFile}
        accept="image/*"
        label="Drop an image here, or click to browse"
        hint="Best for small images — icons, illustrations, avatars."
      />

      {file && !error && (
        <span className="text-sm text-ink/70 dark:text-paper/70">
          {file.name} &middot; {formatBytes(file.size)} &middot; {file.type}
        </span>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {dataUri && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUri}
          alt="Preview of the encoded image"
          className="max-h-64 w-auto rounded-md border border-ink/10 object-contain dark:border-paper/10"
        />
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink/50 dark:text-paper/50">{isEncoding ? 'Encoding…' : 'Data URI'}</span>
        <textarea
          value={dataUri}
          readOnly
          spellCheck={false}
          placeholder="Data URI will appear here…"
          aria-label="Data URI"
          className="h-32 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
        />
        <CopyButton value={dataUri} disabled={!dataUri} />
        <p className="text-xs text-ink/40 dark:text-paper/40">
          Data URIs are best for small images — embedding a large image this way bloats your HTML or CSS file size.
        </p>
      </div>
    </div>
  );
}
