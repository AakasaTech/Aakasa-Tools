import { removeBackground as removeBackgroundImpl, preload, type Config } from '@imgly/background-removal';

export interface DownloadProgress {
  loadedBytes: number;
  totalBytes: number;
}

/**
 * Deliberately smaller than the library's own default ("medium" /
 * isnet_fp16 — verified at ~84MB model + ~11MB wasm ≈ ~95MB total from
 * IMG.LY's live asset manifest for this package version). This tool uses
 * isnet_quint8 instead, the smallest model IMG.LY ships (verified at
 * ~42MB, ~53MB total with the wasm runtime), so a first-time visitor to a
 * free tool isn't asked to pull ~95MB just to try it. Slightly more
 * visible artifacts on tricky images are IMG.LY's own documented tradeoff
 * for this model tier.
 */
const MODEL_CONFIG: Config = {
  device: 'cpu',
  model: 'isnet_quint8',
  // Verified directly in the library's compiled source: `proxyToWorker`
  // only actually takes effect when `device` is 'gpu' and WebGPU is
  // available at runtime — a harmless no-op on the 'cpu' device used here,
  // and correct automatically if a GPU path is ever added later.
  proxyToWorker: true,
  output: { format: 'image/png', quality: 1 },
};

/** ~53MB (42MB quantized model + ~11MB wasm runtime) — read from IMG.LY's
 * published asset manifest for this exact package version rather than
 * guessed, so the pre-download estimate shown to the user is accurate. */
export const ESTIMATED_DOWNLOAD_MB = 53;

let modelReady = false;

export function isModelReady(): boolean {
  return modelReady;
}

function withDownloadProgress(onProgress?: (progress: DownloadProgress) => void): Config {
  const perAsset = new Map<string, { loaded: number; total: number }>();
  return {
    ...MODEL_CONFIG,
    progress: (key, current, total) => {
      if (!key.startsWith('fetch:') || !onProgress) return;
      perAsset.set(key, { loaded: current, total });
      let loadedBytes = 0;
      let totalBytes = 0;
      for (const entry of perAsset.values()) {
        loadedBytes += entry.loaded;
        totalBytes += entry.total;
      }
      onProgress({ loadedBytes, totalBytes });
    },
  };
}

/**
 * Downloads and initializes the model — the explicit, user-initiated
 * "Load AI model" action; nothing is fetched before this is called. Safe
 * to call more than once or alongside `processImageBackground`: the
 * library memoizes initialization by its (JSON-serializable) config, and
 * since `MODEL_CONFIG` is reused unchanged everywhere in this file, every
 * call after the first is a cache hit rather than a re-download.
 */
export async function loadModel(onProgress?: (progress: DownloadProgress) => void): Promise<void> {
  await preload(withDownloadProgress(onProgress));
  modelReady = true;
}

/**
 * Runs background removal on one image, reporting real per-image
 * inference progress (not a simulated spinner) via the library's own
 * `compute:*` stage events, normalized to a 0-1 fraction. Downscaling
 * before inference and upscaling the resulting alpha mask back to the
 * source resolution are both handled internally by the library (its
 * `rescale` option, on by default and left untouched here) — verified
 * directly in its compiled source rather than assumed.
 */
export async function processImageBackground(file: File, onProgress?: (progress: number) => void): Promise<Blob> {
  const config: Config = {
    ...MODEL_CONFIG,
    progress: (key, current, total) => {
      if (key.startsWith('compute:') && onProgress) onProgress(current / total);
    },
  };
  const blob = await removeBackgroundImpl(file, config);
  modelReady = true;
  return blob;
}
