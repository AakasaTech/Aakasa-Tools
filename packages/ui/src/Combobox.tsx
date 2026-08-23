'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the input — this component has no visible <label> of its own. */
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * A type-to-filter select. Built for unit/currency-style lists that are too
 * long to scan as a plain <select> — shows the selected option's label when
 * closed, and a live-filtered listbox while typing. Generic over
 * {value, label} pairs so any tool can reuse it (Unit Converter's unit
 * lists today; a future Currency Converter's ~150-currency list is exactly
 * the case this was built for).
 */
export function Combobox({ options, value, onChange, ariaLabel, placeholder = 'Search…', className = '' }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  function openDropdown() {
    setIsOpen(true);
    setQuery('');
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setIsOpen(false);
    setQuery('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) {
        selectOption(option);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen && filteredOptions[highlightedIndex] ? `${listboxId}-${highlightedIndex}` : undefined}
        value={isOpen ? query : (selectedOption?.label ?? '')}
        placeholder={placeholder}
        onFocus={openDropdown}
        onClick={openDropdown}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        className="h-9 w-full rounded-md border border-ink/10 bg-transparent px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:text-paper"
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-10 mt-1 max-h-56 w-full min-w-max overflow-auto rounded-md border border-ink/10 bg-paper py-1 shadow-md dark:border-paper/10 dark:bg-ink"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-1.5 text-sm text-ink/40 dark:text-paper/40">No matches</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`cursor-pointer whitespace-nowrap px-3 py-1.5 text-sm ${
                  index === highlightedIndex
                    ? 'bg-accent/10 text-ink dark:text-paper'
                    : 'text-ink/80 dark:text-paper/80'
                } ${option.value === value ? 'font-medium' : ''}`}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
