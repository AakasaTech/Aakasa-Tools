'use client';

import { useEffect, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { formatInBase, fromTwosComplement, parseInBase, signedRange, toTwosComplement } from './utils/baseConvert';

type BitWidth = 8 | 16 | 32 | 64;
const BIT_WIDTHS: BitWidth[] = [8, 16, 32, 64];

function BaseField({
  label,
  base,
  value,
  onChange,
}: {
  label: string;
  base: number;
  value: bigint;
  onChange: (value: bigint) => void;
}) {
  const canonicalText = formatInBase(value, base);
  const [text, setText] = useState(canonicalText);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(canonicalText);
    setError(null);
    // canonicalText is re-derived from `value`/`base` every render; only
    // resync the draft when one of those actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, base]);

  function handleChange(raw: string) {
    setText(raw);
    if (raw.trim() === '') {
      setError(null);
      return;
    }
    const parsed = parseInBase(raw, base);
    if (parsed === null) {
      setError(`Not a valid base-${base} value.`);
      return;
    }
    setError(null);
    onChange(parsed);
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink dark:text-paper">{label}</span>
        <CopyButton value={canonicalText} size="sm" />
      </div>
      <input
        type="text"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        spellCheck={false}
        aria-label={label}
        className={`h-10 w-full rounded-md border bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:bg-ink dark:text-paper ${
          error ? 'border-danger' : 'border-ink/15 dark:border-paper/15'
        }`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function NumberBaseConverter() {
  const [value, setValue] = useState(42n);
  const [customBaseText, setCustomBaseText] = useState('3');
  const [bitWidth, setBitWidth] = useState<BitWidth>(8);

  const customBase = Math.min(36, Math.max(2, Math.floor(Number(customBaseText) || 10)));
  const customBaseValid = customBaseText.trim() !== '' && Number.isInteger(Number(customBaseText)) && Number(customBaseText) >= 2 && Number(customBaseText) <= 36;

  const range = signedRange(bitWidth);
  const fitsInBitWidth = value >= range.min && value <= range.max;
  const bits = toTwosComplement(value, bitWidth);

  function toggleBit(indexFromLeft: number) {
    const chars = bits.split('');
    chars[indexFromLeft] = chars[indexFromLeft] === '0' ? '1' : '0';
    const nextValue = fromTwosComplement(chars.join(''), bitWidth);
    setValue(nextValue);
  }

  // Group bits into nibbles (4-bit clusters) for readability at wider widths.
  const bitGroups: { char: string; bitIndex: number }[][] = [];
  for (let i = 0; i < bits.length; i += 4) {
    bitGroups.push(
      bits
        .slice(i, i + 4)
        .split('')
        .map((char, offset) => ({ char, bitIndex: i + offset }))
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BaseField label="Binary (base 2)" base={2} value={value} onChange={setValue} />
        <BaseField label="Octal (base 8)" base={8} value={value} onChange={setValue} />
        <BaseField label="Decimal (base 10)" base={10} value={value} onChange={setValue} />
        <BaseField label="Hexadecimal (base 16)" base={16} value={value} onChange={setValue} />
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink dark:text-paper">Custom base</span>
            <input
              type="text"
              inputMode="numeric"
              value={customBaseText}
              onChange={(event) => setCustomBaseText(event.target.value)}
              className={`h-7 w-14 rounded border bg-paper px-1.5 text-center font-mono text-xs text-ink outline-none dark:bg-ink dark:text-paper ${
                customBaseValid ? 'border-ink/15 dark:border-paper/15' : 'border-danger'
              }`}
            />
          </div>
          {customBaseValid && <CopyButton value={formatInBase(value, customBase)} size="sm" />}
        </div>
        {!customBaseValid ? (
          <span className="text-xs text-danger">Enter a whole number from 2 to 36.</span>
        ) : (
          <BaseField key={customBase} label={`Value in base ${customBase}`} base={customBase} value={value} onChange={setValue} />
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink dark:text-paper">Bitwise view (two&apos;s complement)</span>
          <div className="flex gap-1.5">
            {BIT_WIDTHS.map((w) => (
              <Button key={w} variant={bitWidth === w ? 'primary' : 'secondary'} size="sm" onClick={() => setBitWidth(w)}>
                {w}-bit
              </Button>
            ))}
          </div>
        </div>

        {!fitsInBitWidth && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            {value.toString(10)} doesn&apos;t fit in a signed {bitWidth}-bit value (range {range.min.toString(10)} to{' '}
            {range.max.toString(10)}) — showing the wrapped-around value below, the same way fixed-width integer overflow
            behaves in most languages.
          </p>
        )}

        <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
          {bitGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex gap-1">
              {group.map(({ char, bitIndex }) => (
                <button
                  key={bitIndex}
                  type="button"
                  onClick={() => toggleBit(bitIndex)}
                  aria-label={`Bit ${bitWidth - 1 - bitIndex} (${char === '1' ? 'set' : 'unset'}) — click to flip`}
                  className={`flex h-9 w-7 items-center justify-center rounded font-mono text-sm font-semibold transition-colors ${
                    char === '1'
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-paper/10 dark:text-paper/60 dark:hover:bg-paper/20'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>

        <p className="text-xs text-ink/50 dark:text-paper/50">
          Click a bit to flip it — the value updates in every field above immediately. This shows the {bitWidth}-bit
          two&apos;s-complement representation specifically (the format computers use to store negative integers) —
          separate from the plain sign-and-magnitude values shown in the fields above (e.g. −42 in decimal reads as
          −101010 in binary there, with a minus sign, not as a wrapped bit pattern).
        </p>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
