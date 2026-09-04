'use client';

import { useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { generateMoreLikeThis, generateNameSuggestions, NAMING_STYLES, type GeneratedName, type NamingStyle } from './utils/generateNames';
import { PATTERN_LABELS } from './utils/namePatterns';

const DEFAULT_COUNT = 16;

export function BusinessNameGenerator() {
  const [keywordsInput, setKeywordsInput] = useState('coffee, roastery');
  const [style, setStyle] = useState<NamingStyle>('mixed');
  const [names, setNames] = useState<GeneratedName[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Map<string, GeneratedName>>(new Map());

  const keywords = keywordsInput
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  function handleGenerate() {
    if (keywords.length === 0) return;
    setNames(generateNameSuggestions(keywords, style, DEFAULT_COUNT));
  }

  function toggleFavorite(item: GeneratedName) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    setFavorites((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, item);
      return next;
    });
  }

  function handleMoreLikeThis(item: GeneratedName) {
    const more = generateMoreLikeThis(item, 6);
    setNames((prev) => [...more, ...prev]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Keywords / themes (comma-separated)
          <input
            type="text"
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.target.value)}
            placeholder="e.g. coffee, fitness, software"
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Style (optional)
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as NamingStyle)}
            className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            {NAMING_STYLES.map((option) => (
              <option key={option.value} value={option.value} className="bg-paper text-ink dark:bg-ink dark:text-paper">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button onClick={handleGenerate} disabled={keywords.length === 0} className="self-start">
        Generate names
      </Button>

      <div className="rounded-lg border-y border-r border-l-2 border-l-accent border-ink/10 bg-accent/5 p-3 text-xs text-ink/70 dark:border-paper/10 dark:text-paper/70">
        These are creative starting points, not verified-available names — always run your own trademark search and check domain
        availability yourself before committing to one. This tool doesn&apos;t check either.
      </div>

      {names.length === 0 ? (
        <p className="text-sm text-ink/40 dark:text-paper/40">Enter a keyword and generate a batch of name ideas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {names.map((item) => (
            <NameCard
              key={item.id}
              item={item}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => toggleFavorite(item)}
              onMoreLikeThis={() => handleMoreLikeThis(item)}
            />
          ))}
        </div>
      )}

      {favorites.size > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink dark:text-paper">Shortlist ({favorites.size})</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...favorites.values()].map((item) => (
              <NameCard key={item.id} item={item} isFavorite onToggleFavorite={() => toggleFavorite(item)} onMoreLikeThis={() => handleMoreLikeThis(item)} />
            ))}
          </div>
        </div>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">
        This tool runs entirely in your browser — nothing you enter is uploaded or stored. Your shortlist only lasts for this session; it
        isn&apos;t saved anywhere.
      </span>
    </div>
  );
}

function NameCard({
  item,
  isFavorite,
  onToggleFavorite,
  onMoreLikeThis,
}: {
  item: GeneratedName;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onMoreLikeThis: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-sm text-ink dark:text-paper">{item.name}</span>
        <span className="text-[10px] uppercase tracking-wide text-ink/40 dark:text-paper/40">{PATTERN_LABELS[item.patternType]}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onMoreLikeThis} aria-label={`Generate more names like ${item.name}`}>
          More like this
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Remove ${item.name} from shortlist` : `Add ${item.name} to shortlist`}
          className={isFavorite ? 'text-accent' : ''}
        >
          {isFavorite ? '★' : '☆'}
        </Button>
        <CopyButton value={item.name} size="sm" />
      </div>
    </div>
  );
}
