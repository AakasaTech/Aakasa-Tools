export interface MorseAudioOptions {
  wpm: number;
  frequency: number;
}

interface LetterToken {
  morseChars: string;
  /** Start index of this letter's dot/dash run within the original Morse string — for the caller's visual highlight. */
  start: number;
  gapAfter: 'inter-letter' | 'inter-word' | 'none';
}

export interface MorseLetterPosition {
  start: number;
  end: number;
}

/**
 * The ordered list of letter-token [start, end) ranges within a Morse
 * string — the exact same spans `playMorseAudio` schedules tones for and
 * fires `onSymbolStart` with. Exported so a UI can independently compute
 * "which range is currently highlighted" from a fired index without
 * re-deriving its own, potentially-diverging tokenization.
 */
export function getMorseLetterPositions(morse: string): MorseLetterPosition[] {
  return tokenizeMorse(morse).map((token) => ({ start: token.start, end: token.start + token.morseChars.length }));
}

/**
 * Finds every run of dots/dashes in the Morse string (each one a single
 * letter), with its exact character offset preserved, and classifies the
 * gap that follows it by scanning the separator text between it and the
 * next run — a "/" anywhere in that gap means an inter-word gap, plain
 * whitespace means an inter-letter gap. Working this way (rather than a
 * single left-to-right state machine over separators) stays correct
 * regardless of incidental formatting like extra spaces around a "/".
 */
function tokenizeMorse(morse: string): LetterToken[] {
  const runs: { text: string; start: number; end: number }[] = [];
  const regex = /[.-]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(morse)) !== null) {
    runs.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }

  return runs.map((run, i) => {
    const next = runs[i + 1];
    let gapAfter: LetterToken['gapAfter'] = 'none';
    if (next) {
      const between = morse.slice(run.end, next.start);
      gapAfter = between.includes('/') ? 'inter-word' : 'inter-letter';
    }
    return { morseChars: run.text, start: run.start, gapAfter };
  });
}

export interface MorseTiming {
  ditMs: number;
  dahMs: number;
  intraLetterGapMs: number;
  interLetterGapMs: number;
  interWordGapMs: number;
}

/** Standard PARIS-based WPM timing: one dit = 1200/wpm ms, every other duration a fixed multiple of it. */
export function getMorseTiming(wpm: number): MorseTiming {
  const ditMs = 1200 / wpm;
  return {
    ditMs,
    dahMs: ditMs * 3,
    intraLetterGapMs: ditMs * 1,
    interLetterGapMs: ditMs * 3,
    interWordGapMs: ditMs * 7,
  };
}

/**
 * Plays `morse` as audible tones via the Web Audio API, following standard
 * Morse timing ratios exactly (never arbitrary fixed delays). Tones
 * themselves are scheduled on the AudioContext's own clock for
 * sample-accurate playback; `onSymbolStart` — fired once per letter, at
 * the moment that letter's first tone begins — is scheduled with
 * `setTimeout` at the same cumulative offset used to schedule that tone,
 * so the visual highlight and the audio stay in step.
 */
export function playMorseAudio(
  morse: string,
  options: MorseAudioOptions,
  onSymbolStart?: (index: number) => void
): Promise<void> {
  const tokens = tokenizeMorse(morse);
  if (tokens.length === 0) {
    return Promise.resolve();
  }

  const timing = getMorseTiming(options.wpm);
  const audioCtx = new AudioContext();
  const startTime = audioCtx.currentTime;
  const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  let cumulativeMs = 0;

  for (const token of tokens) {
    if (onSymbolStart) {
      const letterStartMs = cumulativeMs;
      pendingTimeouts.push(setTimeout(() => onSymbolStart(token.start), letterStartMs));
    }

    for (let i = 0; i < token.morseChars.length; i += 1) {
      const isDash = token.morseChars[i] === '-';
      const durationMs = isDash ? timing.dahMs : timing.ditMs;
      const toneStartSec = startTime + cumulativeMs / 1000;
      const toneEndSec = toneStartSec + durationMs / 1000;

      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = options.frequency;

      // A short linear gain ramp at each tone's start/end avoids the
      // audible "click" a hard on/off step would otherwise produce.
      const rampSec = Math.min(0.005, durationMs / 1000 / 4);
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, toneStartSec);
      gainNode.gain.linearRampToValueAtTime(1, toneStartSec + rampSec);
      gainNode.gain.setValueAtTime(1, Math.max(toneStartSec + rampSec, toneEndSec - rampSec));
      gainNode.gain.linearRampToValueAtTime(0, toneEndSec);

      oscillator.connect(gainNode).connect(audioCtx.destination);
      oscillator.start(toneStartSec);
      oscillator.stop(toneEndSec);

      cumulativeMs += durationMs;
      const isLastSymbolInLetter = i === token.morseChars.length - 1;
      if (!isLastSymbolInLetter) {
        cumulativeMs += timing.intraLetterGapMs;
      }
    }

    if (token.gapAfter === 'inter-word') {
      cumulativeMs += timing.interWordGapMs;
    } else if (token.gapAfter === 'inter-letter') {
      cumulativeMs += timing.interLetterGapMs;
    }
  }

  const totalMs = cumulativeMs;

  return new Promise((resolve) => {
    pendingTimeouts.push(
      setTimeout(() => {
        void audioCtx.close();
        resolve();
      }, totalMs + 50)
    );
  });
}
