/**
 * gif.js (jnordberg/gif.js, MIT) ships no TypeScript types and there's no
 * maintained @types package for it — this is a minimal ambient
 * declaration covering only the API surface this tool actually calls,
 * verified directly against `node_modules/gif.js/dist/gif.js` rather than
 * the README alone.
 */
declare module 'gif.js' {
  export interface GifOptions {
    workers?: number;
    workerScript?: string;
    quality?: number;
    width?: number;
    height?: number;
    repeat?: number;
    background?: string;
    transparent?: string | null;
    dither?: boolean | string;
    debug?: boolean;
  }

  export interface GifFrameOptions {
    delay?: number;
    copy?: boolean;
  }

  export default class GIF {
    constructor(options?: GifOptions);
    addFrame(image: CanvasImageSource | ImageData | CanvasRenderingContext2D, options?: GifFrameOptions): void;
    on(event: 'start' | 'abort', callback: () => void): void;
    on(event: 'progress', callback: (percent: number) => void): void;
    on(event: 'finished', callback: (blob: Blob, data: Uint8Array) => void): void;
    render(): void;
    abort(): void;
  }
}
