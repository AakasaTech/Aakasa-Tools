'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, type ButtonSize } from './Button';

export interface CopyButtonProps {
  /** The text to copy to the clipboard. */
  value: string;
  /** Label shown before copying. Defaults to "Copy". */
  label?: string;
  size?: ButtonSize;
  disabled?: boolean;
}

/**
 * Copies `value` to the clipboard and briefly shows a "Copied" state —
 * no toast library, just local component state.
 */
export function CopyButton({ value, label = 'Copy', size = 'sm', disabled = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can reject (permissions, insecure context) — the
      // button simply stays in its unlabeled state rather than throwing.
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      onClick={() => void handleCopy()}
      disabled={disabled || !value}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}
