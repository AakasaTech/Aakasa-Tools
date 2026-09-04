'use client';

import { useId, useState } from 'react';
import type { YearData } from './utils/compoundInterest';

const CONTRIBUTIONS_COLOR = '#5B6EF5'; // accent
const INTEREST_COLOR = '#1BA672'; // success
const CHART_WIDTH = 640;
const CHART_HEIGHT = 300;
const MARGIN = { top: 16, right: 12, bottom: 28, left: 64 };
const BAR_RADIUS = 4;
const SEGMENT_GAP = 2;

/** Formats an axis value compactly, keeping one decimal place (trimmed if
 * it's `.0`) so adjacent ticks like $1,500 and $2,000 don't both round down
 * to the same "$2K" label. */
function formatCompact(value: number): string {
  const trimOneDecimal = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  if (Math.abs(value) >= 1_000_000) return `$${trimOneDecimal(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `$${trimOneDecimal(value / 1_000)}K`;
  return `$${value.toFixed(0)}`;
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Rounds `roughMax` up to a visually clean axis ceiling (1/2/5 × a power of ten). */
function niceCeiling(roughMax: number): number {
  if (roughMax <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(roughMax));
  const normalized = roughMax / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  if (height <= 0 || width <= 0) return '';
  return `M ${x} ${y + height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height} Z`;
}

export function GrowthChart({ yearlyBreakdown }: { yearlyBreakdown: YearData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const titleId = useId();

  if (yearlyBreakdown.length === 0) return null;

  const maxBalance = yearlyBreakdown[yearlyBreakdown.length - 1]?.balance ?? 0;
  const axisMax = niceCeiling(maxBalance);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (axisMax / tickCount) * i);

  const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const baseY = MARGIN.top + innerHeight;

  const n = yearlyBreakdown.length;
  const bandWidth = innerWidth / n;
  const barWidth = Math.min(24, bandWidth * 0.62);

  // Thin x-axis labels so they don't collide when there are many years —
  // every data point still gets its own bar and hover/keyboard-focus target.
  const labelStride = Math.max(1, Math.ceil(n / 10));

  const valueToPx = (value: number) => (value / axisMax) * innerHeight;

  const hovered = hoveredIndex !== null ? yearlyBreakdown[hoveredIndex] : null;

  const chartTitle = `Balance growth by year, split into contributions and interest earned. Final balance ${formatUsd(maxBalance)}.`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-xs text-ink/70 dark:text-paper/70">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CONTRIBUTIONS_COLOR }} />
          Contributions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INTEREST_COLOR }} />
          Interest earned
        </span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{chartTitle}</title>

        {ticks.map((tick) => {
          const y = baseY - valueToPx(tick);
          return (
            <g key={tick}>
              <line x1={MARGIN.left} x2={CHART_WIDTH - MARGIN.right} y1={y} y2={y} stroke="currentColor" strokeWidth={1} className="text-ink/10 dark:text-paper/10" />
              <text x={MARGIN.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-ink/50 text-[10px] dark:fill-paper/50">
                {formatCompact(tick)}
              </text>
            </g>
          );
        })}

        {yearlyBreakdown.map((yearData, i) => {
          const bandX = MARGIN.left + i * bandWidth;
          const barX = bandX + (bandWidth - barWidth) / 2;

          const contributionsPx = valueToPx(yearData.cumulativeContributions);
          const interestPx = valueToPx(yearData.cumulativeInterest);

          const contributionsY = baseY - contributionsPx;
          const interestTrimmed = Math.max(0, interestPx - SEGMENT_GAP);
          const interestY = contributionsY - interestTrimmed;

          const isHovered = hoveredIndex === i;

          return (
            <g key={yearData.year} opacity={hoveredIndex === null || isHovered ? 1 : 0.55}>
              <rect x={barX} y={contributionsY} width={barWidth} height={contributionsPx} fill={CONTRIBUTIONS_COLOR} />
              <path d={roundedTopRectPath(barX, interestY, barWidth, interestTrimmed, BAR_RADIUS)} fill={INTEREST_COLOR} />

              {i % labelStride === 0 && (
                <text x={bandX + bandWidth / 2} y={CHART_HEIGHT - 8} textAnchor="middle" className="fill-ink/50 text-[10px] dark:fill-paper/50">
                  {Number.isInteger(yearData.year) ? `Yr ${yearData.year}` : yearData.year}
                </text>
              )}

              {/* Hit target is the full band height, wider than the painted bar, for reliable hover/focus. */}
              <rect
                x={bandX}
                y={MARGIN.top}
                width={bandWidth}
                height={innerHeight}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`Year ${yearData.year}: balance ${formatUsd(yearData.balance)}, contributions ${formatUsd(yearData.cumulativeContributions)}, interest ${formatUsd(yearData.cumulativeInterest)}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(i)}
                onBlur={() => setHoveredIndex(null)}
                className="outline-none focus-visible:fill-ink/5 dark:focus-visible:fill-paper/10"
              />
            </g>
          );
        })}

        {hovered &&
          hoveredIndex !== null &&
          (() => {
            const tooltipWidth = 172;
            const tooltipHeight = 68;
            const bandX = MARGIN.left + hoveredIndex * bandWidth + bandWidth / 2;
            const rawX = bandX - tooltipWidth / 2;
            const tooltipX = Math.max(MARGIN.left, Math.min(CHART_WIDTH - MARGIN.right - tooltipWidth, rawX));
            const tooltipY = MARGIN.top;
            return (
              <g pointerEvents="none">
                <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={6} className="fill-paper stroke-ink/15 dark:fill-ink dark:stroke-paper/15" strokeWidth={1} />
                <text x={tooltipX + 10} y={tooltipY + 18} className="fill-ink text-[11px] font-semibold dark:fill-paper">
                  {Number.isInteger(hovered.year) ? `Year ${hovered.year}` : `Year ${hovered.year}`}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 34} className="fill-ink text-[10px] dark:fill-paper">
                  Balance: {formatUsd(hovered.balance)}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 48} className="text-[10px]" fill={CONTRIBUTIONS_COLOR}>
                  Contributions: {formatUsd(hovered.cumulativeContributions)}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 62} className="text-[10px]" fill={INTEREST_COLOR}>
                  Interest: {formatUsd(hovered.cumulativeInterest)}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
