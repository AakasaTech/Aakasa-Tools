import { HASH_ALGORITHMS, type HashAlgorithm } from '../../uuid-hash-generator/utils/hash';

/** Hex-character output length for each algorithm, used to spot a likely
 * wrong-algorithm selection from the pasted hash's length alone. */
const ALGORITHM_HEX_LENGTHS: Record<HashAlgorithm, number> = {
  MD5: 32,
  'SHA-1': 40,
  'SHA-256': 64,
  'SHA-512': 128,
};

/** Normalizes a pasted hash for comparison: trims surrounding whitespace
 * (a common paste artifact), lowercases it (hex hashes are published in
 * either case), and strips a leading "0x" prefix if present. */
export function normalizeHashForComparison(hash: string): string {
  const trimmed = hash.trim().toLowerCase();
  return trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
}

/**
 * If `expectedHash`'s length doesn't match `selectedAlgorithm`'s output
 * length, but DOES match exactly one other algorithm's output length,
 * returns that algorithm as a likely-intended selection — e.g. pasting a
 * 32-character MD5 hash while SHA-256 is selected. Returns null when the
 * length already matches the selected algorithm, or matches no known
 * algorithm at all (nothing specific to suggest).
 */
export function detectLikelyAlgorithmMismatch(expectedHash: string, selectedAlgorithm: HashAlgorithm): HashAlgorithm | null {
  const normalized = normalizeHashForComparison(expectedHash);
  if (!normalized || !/^[0-9a-f]+$/.test(normalized)) return null;
  if (normalized.length === ALGORITHM_HEX_LENGTHS[selectedAlgorithm]) return null;

  const candidates = HASH_ALGORITHMS.filter((alg) => alg !== selectedAlgorithm && ALGORITHM_HEX_LENGTHS[alg] === normalized.length);
  return candidates.length === 1 ? candidates[0]! : null;
}
