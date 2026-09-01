import GIF from 'gif.js';
import type { NormalizedFrame } from './normalizeFrames';

export interface GifEncodeOptions {
  width: number;
  height: number;
  /** gif.js's real quality knob: the NeuQuant color-quantizer's pixel
   * *sample interval*, 1 (best quality, slowest) to ~30 (fastest, worst).
   * Verified directly in gif.js's source (`TypedNeuQuant.js`) that the
   * palette size itself is hardcoded to 256 colors — there is no actual
   * "target color count" parameter to set, despite that being a common
   * mental model for GIF quality controls. */
  quality: number;
  /** 0 = loop forever, -1 = play once. */
  repeat: number;
  dither: boolean;
}

/**
 * Encodes `frames` into an animated GIF using gif.js, whose encoding work
 * — the CPU-intensive part, color quantization and LZW compression per
 * frame — genuinely runs off the main thread. Verified directly in
 * gif.js's source (`spawnWorkers()` calls `new Worker(workerScript)` and
 * dispatches each frame via `worker.postMessage`), not assumed from its
 * docs. `workerScript` points at `/gif.worker.js`, copied from
 * `node_modules/gif.js/dist/gif.worker.js` into this app's `public/`
 * directory — gif.js expects to fetch it as a real, separately-served
 * script URL at runtime, not something webpack bundles automatically.
 */
export function encodeGifFromFrames(frames: NormalizedFrame[], options: GifEncodeOptions, onProgress?: (percent: number) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (frames.length === 0) {
      reject(new Error('No frames to encode.'));
      return;
    }

    const workerCount = Math.max(1, Math.min(4, typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2));
    const gif = new GIF({
      workers: workerCount,
      workerScript: '/gif.worker.js',
      quality: options.quality,
      width: options.width,
      height: options.height,
      repeat: options.repeat,
      dither: options.dither ? 'FloydSteinberg' : false,
    });

    gif.on('progress', (percent) => onProgress?.(Math.round(percent * 100)));
    gif.on('finished', (blob) => resolve(blob));
    gif.on('abort', () => reject(new Error('GIF encoding was aborted.')));

    for (const frame of frames) {
      gif.addFrame(frame.canvas, { delay: frame.delay, copy: true });
    }

    gif.render();
  });
}
