'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

export interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  label?: string;
  hint?: string;
}

/**
 * Drag-and-drop (or click-to-browse) file picker. Reports the selected
 * `File` back to the caller and does nothing else — size limits, previews,
 * and upload/no-upload semantics are entirely the caller's concern, since
 * those vary per tool.
 */
export function FileDropzone({ onFileSelected, accept, label, hint }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openFileDialog() {
    inputRef.current?.click();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFileDialog();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileSelected(file);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Reset so selecting the same file again still fires onChange.
    event.target.value = '';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openFileDialog}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isDragActive ? 'border-accent bg-accent/5' : 'border-ink/15 hover:border-ink/30 dark:border-paper/15 dark:hover:border-paper/30'
      }`}
    >
      <span className="text-ink/70 dark:text-paper/70">{label ?? 'Drop a file here, or click to browse'}</span>
      {hint && <span className="text-xs text-ink/40 dark:text-paper/40">{hint}</span>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}
