/**
 * Standard, published formula coefficients — Flesch (1948) for Reading
 * Ease, Flesch & Kincaid (1975) for Grade Level. Verified against current
 * published references rather than approximated from memory, since a
 * wrong coefficient would silently produce plausible-looking but
 * incorrect scores.
 */

/** 206.835 − 1.015 × (words ÷ sentences) − 84.6 × (syllables ÷ words).
 * 0–100 scale; higher means easier to read. */
export function calculateFleschReadingEase(avgSentenceLength: number, avgSyllablesPerWord: number): number {
  return 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
}

/** 0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59.
 * Maps approximately to a US school grade level. */
export function calculateFleschKincaidGrade(avgSentenceLength: number, avgSyllablesPerWord: number): number {
  return 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
}

export interface ReadabilityBand {
  min: number;
  max: number;
  label: string;
  gradeDescription: string;
}

/** The standard published Flesch Reading Ease interpretation bands. */
export const READING_EASE_BANDS: ReadabilityBand[] = [
  { min: 90, max: 100, label: 'Very Easy', gradeDescription: '5th grade' },
  { min: 80, max: 90, label: 'Easy', gradeDescription: '6th grade' },
  { min: 70, max: 80, label: 'Fairly Easy', gradeDescription: '7th grade' },
  { min: 60, max: 70, label: 'Standard', gradeDescription: '8th–9th grade' },
  { min: 50, max: 60, label: 'Fairly Difficult', gradeDescription: '10th–12th grade' },
  { min: 30, max: 50, label: 'Difficult', gradeDescription: 'College' },
  { min: 0, max: 30, label: 'Very Difficult', gradeDescription: 'College graduate' },
];

export function getReadingEaseBand(score: number): ReadabilityBand {
  const clamped = Math.max(0, Math.min(100, score));
  return READING_EASE_BANDS.find((band) => clamped >= band.min && clamped <= band.max) ?? READING_EASE_BANDS[READING_EASE_BANDS.length - 1]!;
}
