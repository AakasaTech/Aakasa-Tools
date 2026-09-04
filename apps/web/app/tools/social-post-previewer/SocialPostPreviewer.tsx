'use client';

import { useState } from 'react';
import { CopyButton } from '@aakasa/ui';
import { PLATFORM_CONFIGS, PLATFORMS, type PlatformConfig } from './utils/platformLimits';
import { countHashtagsAndMentions, countPlatformCharacters } from './utils/countCharacters';

const SAMPLE_TEXT = "Excited to share our new feature launch! Check it out: https://example.com/launch #productlaunch #buildinpublic @teammate";

export function SocialPostPreviewer() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const { hashtags, mentions } = countHashtagsAndMentions(text);

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
        Post content
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write your post once, see how it fares across platforms…"
          className="h-32 w-full resize-y rounded-md border border-ink/15 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4 text-xs text-ink/60 dark:text-paper/60">
        <span>
          <span className="font-mono font-semibold text-ink dark:text-paper">{hashtags}</span> hashtag{hashtags === 1 ? '' : 's'}
        </span>
        <span>
          <span className="font-mono font-semibold text-ink dark:text-paper">{mentions}</span> mention{mentions === 1 ? '' : 's'}
        </span>
        <CopyButton value={text} label="Copy post text" size="sm" />
      </div>

      <SummaryRow text={text} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platformId) => (
          <PlatformCard key={platformId} platform={PLATFORM_CONFIGS[platformId]} text={text} hashtagCount={hashtags} />
        ))}
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Platform character-counting rules and limits can change over time — these reflect each platform&apos;s documented rules as of when this
        tool was built. For anything business-critical, double-check against the platform&apos;s own current guidance. This tool runs entirely in
        your browser — nothing you write here is uploaded or stored.
      </span>
    </div>
  );
}

function SummaryRow({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((platformId) => {
        const platform = PLATFORM_CONFIGS[platformId];
        const count = countPlatformCharacters(text, platform);
        const fits = count <= platform.charLimit;
        return (
          <span
            key={platformId}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              fits
                ? 'border-ink/15 text-ink/70 dark:border-paper/15 dark:text-paper/70'
                : 'border-danger/40 bg-danger/10 text-danger'
            }`}
          >
            {platform.label} {fits ? '✓ fits' : `✗ over by ${(count - platform.charLimit).toLocaleString()}`}
          </span>
        );
      })}
    </div>
  );
}

function PlatformCard({ platform, text, hashtagCount }: { platform: PlatformConfig; text: string; hashtagCount: number }) {
  const count = countPlatformCharacters(text, platform);
  const remaining = platform.charLimit - count;
  const isOverLimit = remaining < 0;
  const isOverHashtagLimit = platform.hashtagLimit !== undefined && hashtagCount > platform.hashtagLimit;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-ink dark:text-paper">{platform.label}</span>
        <span className={`font-mono text-sm ${isOverLimit ? 'font-semibold text-danger' : 'text-ink/60 dark:text-paper/60'}`}>
          {count.toLocaleString()} / {platform.charLimit.toLocaleString()}
        </span>
      </div>

      <div
        className={`text-xs ${isOverLimit ? 'font-medium text-danger' : 'text-ink/50 dark:text-paper/50'}`}
      >
        {isOverLimit ? `${Math.abs(remaining).toLocaleString()} characters over the limit` : `${remaining.toLocaleString()} characters remaining`}
      </div>

      {platform.hashtagLimit !== undefined && (
        <div className={`text-xs ${isOverHashtagLimit ? 'font-medium text-danger' : 'text-ink/50 dark:text-paper/50'}`}>
          {hashtagCount} / {platform.hashtagLimit} hashtags{isOverHashtagLimit ? ' — over the limit, this many hashtags may be rejected' : ''}
        </div>
      )}

      <p className="text-xs text-ink/40 dark:text-paper/40">{platform.limitNote}</p>

      {/* Generic, schematic feed-post preview — approximate proportions
          only, not a reproduction of the platform's actual proprietary UI. */}
      <div className="rounded-md border border-ink/10 bg-ink/[0.03] p-3 dark:border-paper/10 dark:bg-paper/[0.03]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-xs text-ink/50 dark:bg-paper/10 dark:text-paper/50">
            •
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-ink/70 dark:text-paper/70">Your Name</span>
            <span className="text-[10px] text-ink/40 dark:text-paper/40">@handle</span>
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-xs text-ink dark:text-paper">{text || '(nothing written yet)'}</p>
        <div className="mt-2 flex gap-4 text-ink/30 dark:text-paper/30">
          <span aria-hidden className="text-xs">
            ♡ Like
          </span>
          <span aria-hidden className="text-xs">
            ↺ Share
          </span>
          <span aria-hidden className="text-xs">
            💬 Comment
          </span>
        </div>
      </div>
    </div>
  );
}
