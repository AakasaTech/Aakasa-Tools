import { CopyButton } from './CopyButton';

export interface BulkListProps {
  items: string[];
  /** Optional override for what's shown per row; defaults to the raw item text. */
  renderLabel?: (item: string) => string;
}

/**
 * Scrollable list of generated strings, each individually copyable, plus a
 * "Copy all" action. Display-only — the "Generate N" trigger and the actual
 * generation logic stay with the caller since wording and generation differ
 * per tool.
 */
export function BulkList({ items, renderLabel }: BulkListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <CopyButton value={items.join('\n')} label="Copy all" size="sm" />
      </div>
      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-ink/10 p-2 dark:border-paper/10">
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-ink/5 dark:hover:bg-paper/5"
          >
            <span className="truncate font-mono text-sm text-ink dark:text-paper">
              {renderLabel ? renderLabel(item) : item}
            </span>
            <CopyButton value={item} label="Copy" size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
