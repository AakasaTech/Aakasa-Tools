'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

export interface FileDropzoneProps {
  /** Called with the first selected file. Ignored when `onFilesSelected` is provided. */
  onFileSelected?: (file: File) => void;
  /** Called with every selected file — required when `multiple` is true. */
  onFilesSelected?: (files: File[]) => void;
  /** Allow selecting/dropping more than one file at once. @default false */
  multiple?: boolean;
  accept?: string;
  label?: string;
  hint?: string;
}

/**
 * Drag-and-drop (or click-to-browse) file picker. Reports the selected
 * file(s) back to the caller and does nothing else — size limits, previews,
 * and upload/no-upload semantics are entirely the caller's concern, since
 * those vary per tool. Single-file callers keep using `onFileSelected`;
 * pass `multiple` + `onFilesSelected` for batch pickers.
 */
export function FileDropzone({
  onFileSelected,
  onFilesSelected,
  multiple = false,
  accept,
  label,
  hint,
}: FileDropzoneProps) {
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

  function emitFiles(fileList: FileList) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }
    if (onFilesSelected) {
      onFilesSelected(multiple ? files : files.slice(0, 1));
      return;
    }
    const [first] = files;
    if (first) {
      onFileSelected?.(first);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    emitFiles(event.dataTransfer.files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      emitFiles(event.target.files);
    }
    // Reset so selecting the same file(s) again still fires onChange.
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
      <span className="text-ink/70 dark:text-paper/70">
        {label ?? (multiple ? 'Drop files here, or click to browse' : 'Drop a file here, or click to browse')}
      </span>
      {hint && <span className="text-xs text-ink/40 dark:text-paper/40">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
