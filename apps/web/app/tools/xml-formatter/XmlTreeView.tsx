'use client';

import { useState } from 'react';

// XML's shape doesn't map onto JSON's tree (attributes, mixed content,
// namespaces aren't things JSON has), so this renders the parsed DOM
// Element tree directly rather than adapting JsonTreeView's plain-object
// tree model.

const MAX_VISIBLE_CHILDREN = 200;

function getDirectText(el: Element): string {
  let text = '';
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text.trim();
}

function AttributeList({ el }: { el: Element }) {
  const attrs = Array.from(el.attributes);
  if (attrs.length === 0) {
    return null;
  }
  return (
    <>
      {attrs.map((attr) => (
        <span key={attr.name} className="text-ink/50 dark:text-paper/50">
          {' '}
          {attr.name}=<span className="text-success">&quot;{attr.value}&quot;</span>
        </span>
      ))}
    </>
  );
}

interface XmlElementNodeProps {
  el: Element;
  depth: number;
}

function XmlElementNode({ el, depth }: XmlElementNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE_CHILDREN);

  const elementChildren = Array.from(el.children);
  const hasElementChildren = elementChildren.length > 0;
  const text = getDirectText(el);
  const hiddenCount = elementChildren.length - visibleCount;

  if (!hasElementChildren) {
    return (
      <li style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
        <div className="flex items-start gap-1">
          <span className="mt-0.5 w-3 shrink-0" aria-hidden />
          <span>
            <span className="text-accent">&lt;{el.tagName}</span>
            <AttributeList el={el} />
            {text ? (
              <>
                <span className="text-accent">&gt;</span>
                <span className="text-ink dark:text-paper">{text}</span>
                <span className="text-accent">&lt;/{el.tagName}&gt;</span>
              </>
            ) : (
              <span className="text-accent">/&gt;</span>
            )}
          </span>
        </div>
      </li>
    );
  }

  return (
    <li style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="mt-0.5 w-3 shrink-0 text-ink/40 hover:text-accent dark:text-paper/40"
        >
          {expanded ? '−' : '+'}
        </button>
        <span>
          <span className="text-accent">&lt;{el.tagName}</span>
          <AttributeList el={el} />
          <span className="text-accent">{expanded ? '>' : `> … ${elementChildren.length} child${elementChildren.length === 1 ? '' : 'ren'}`}</span>
        </span>
      </div>

      {expanded && (
        <>
          <ul>
            {elementChildren.slice(0, visibleCount).map((child, index) => (
              <XmlElementNode key={index} el={child} depth={depth + 1} />
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + MAX_VISIBLE_CHILDREN)}
              className="text-ink/40 hover:text-accent dark:text-paper/40"
              style={{ paddingLeft: depth === 0 ? 12 : 26 }}
            >
              … {hiddenCount.toLocaleString()} more element{hiddenCount === 1 ? '' : 's'} — show more
            </button>
          )}
          <div className="text-accent" style={{ paddingLeft: depth === 0 ? 12 : 26 }}>
            &lt;/{el.tagName}&gt;
          </div>
        </>
      )}
    </li>
  );
}

export interface XmlTreeViewProps {
  root: Element;
}

export function XmlTreeView({ root }: XmlTreeViewProps) {
  return (
    <ul className="font-mono text-sm">
      <XmlElementNode el={root} depth={0} />
    </ul>
  );
}
