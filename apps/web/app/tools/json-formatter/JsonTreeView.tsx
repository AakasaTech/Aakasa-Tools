'use client';

import { useMemo, useState } from 'react';
import { buildJsonTree, type JsonTreeNode } from './utils/jsonFormat';

// A container can hold thousands of entries (this tool is expected to handle
// >500KB input). Rendering every child as a DOM node the moment its parent
// expands can lock up the tab, so each level only ever renders this many
// children up front — the rest stay off-DOM until explicitly requested.
const MAX_VISIBLE_CHILDREN = 200;

export interface JsonTreeViewProps {
  value: unknown;
}

export function JsonTreeView({ value }: JsonTreeViewProps) {
  const tree = useMemo(() => buildJsonTree(value), [value]);

  return (
    <ul className="font-mono text-sm">
      <JsonTreeNodeItem node={tree} depth={0} />
    </ul>
  );
}

interface JsonTreeNodeItemProps {
  node: JsonTreeNode;
  depth: number;
}

function JsonTreeNodeItem({ node, depth }: JsonTreeNodeItemProps) {
  // Only the root starts open — auto-expanding deeper levels by default is
  // how a wide top-level array turns into tens of thousands of expanded DOM
  // nodes on first render.
  const [expanded, setExpanded] = useState(depth === 0);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE_CHILDREN);
  const isContainer = node.type === 'object' || node.type === 'array';
  const openBracket = node.type === 'array' ? '[' : '{';
  const closeBracket = node.type === 'array' ? ']' : '}';
  const children = node.children ?? [];
  const hiddenCount = children.length - visibleCount;

  return (
    <li style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
      <div className="flex items-start gap-1">
        {isContainer ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="mt-0.5 w-3 shrink-0 text-ink/40 hover:text-accent dark:text-paper/40"
          >
            {expanded ? '−' : '+'}
          </button>
        ) : (
          <span className="mt-0.5 w-3 shrink-0" aria-hidden />
        )}

        <span>
          {node.key !== null && <span className="text-accent">{JSON.stringify(node.key)}: </span>}
          {isContainer ? (
            <span className="text-ink/50 dark:text-paper/50">
              {openBracket}
              {!expanded && children.length > 0 ? '…' : ''}
              {!expanded ? closeBracket : ''}
            </span>
          ) : (
            <JsonLeafValue node={node} />
          )}
        </span>
      </div>

      {isContainer && expanded && (
        <>
          <ul>
            {children.slice(0, visibleCount).map((child, index) => (
              <JsonTreeNodeItem key={child.key ?? index} node={child} depth={depth + 1} />
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + MAX_VISIBLE_CHILDREN)}
              className="text-ink/40 hover:text-accent dark:text-paper/40"
              style={{ paddingLeft: depth === 0 ? 12 : 26 }}
            >
              … {hiddenCount.toLocaleString()} more item{hiddenCount === 1 ? '' : 's'} — show more
            </button>
          )}
          <div className="text-ink/50 dark:text-paper/50" style={{ paddingLeft: depth === 0 ? 12 : 26 }}>
            {closeBracket}
          </div>
        </>
      )}
    </li>
  );
}

function JsonLeafValue({ node }: { node: JsonTreeNode }) {
  if (node.type === 'string') {
    return <span className="text-success">{JSON.stringify(node.value)}</span>;
  }
  if (node.type === 'number') {
    return <span className="text-accent">{String(node.value)}</span>;
  }
  if (node.type === 'boolean') {
    return <span className="text-danger">{String(node.value)}</span>;
  }
  return <span className="text-ink/40 dark:text-paper/40">null</span>;
}
