/**
 * Per-language beautify/minify, each wrapping a dedicated library rather
 * than one generic tool — js-beautify's own "minify" mode is whitespace-only,
 * not a real minifier, so genuine minification goes through terser (JS),
 * clean-css (CSS), and html-minifier-terser (HTML) instead.
 *
 * Every library import here is a dynamic `import()` INSIDE the function
 * that needs it, not a static top-of-file import — so switching to, say,
 * the CSS tab and only ever minifying CSS never pulls terser (by far the
 * largest of the four) or html-minifier-terser into the page at all. The
 * component calls these functions without knowing or managing any of that
 * lazy-loading itself.
 *
 * Confirmed empirically, not assumed, per library:
 *  - terser THROWS a real Error (JS_Parse_Error) on JS it can't parse, with
 *    `.line`/`.col` on the error object.
 *  - clean-css is lenient/best-effort — never threw in testing, even on an
 *    unclosed brace or nonsense input; it just returns whatever it could
 *    produce plus an `errors` array (empty in every case tested).
 *  - html-minifier-terser is mostly lenient (auto-closes unclosed tags,
 *    like a real HTML parser would) but CAN throw a genuine Error on input
 *    it truly can't tokenize.
 *  - js-beautify (all three sub-beautifiers) never throws — it's a
 *    best-effort formatter, consistent with beautifiers generally.
 */

export type BraceStyle = 'collapse' | 'expand';

export interface BeautifyOptions {
  indentSize: number;
  useTabs: boolean;
  /** Only meaningful for JS — CSS/HTML beautification in js-beautify has no brace-style concept. */
  braceStyle: BraceStyle;
}

export interface MinifyJsOptions {
  /** On by default for maximum size reduction; off for whitespace-only minification that's still readable/debuggable by variable name. */
  mangle: boolean;
}

export interface TransformResult {
  result: string;
  error?: string;
}

function formatTerserError(err: unknown): string {
  if (err instanceof Error) {
    const withPosition = err as Error & { line?: number; col?: number };
    if (typeof withPosition.line === 'number' && typeof withPosition.col === 'number') {
      return `Line ${withPosition.line}, column ${withPosition.col}: ${err.message}`;
    }
    return err.message;
  }
  return 'Could not minify this JavaScript — it may contain a syntax error.';
}

export async function beautifyJs(code: string, options: BeautifyOptions): Promise<TransformResult> {
  try {
    const { default: beautify } = await import('js-beautify');
    const result = beautify.js(code, {
      indent_size: options.indentSize,
      indent_with_tabs: options.useTabs,
      brace_style: options.braceStyle,
    });
    return { result };
  } catch (err) {
    return { result: '', error: err instanceof Error ? err.message : 'Could not beautify this JavaScript.' };
  }
}

export async function minifyJs(code: string, options: MinifyJsOptions): Promise<TransformResult> {
  try {
    const { minify } = await import('terser');
    const output = await minify(code, { mangle: options.mangle, compress: true });
    if (!output.code) {
      return { result: '', error: 'Terser produced no output for this input.' };
    }
    return { result: output.code };
  } catch (err) {
    return { result: '', error: formatTerserError(err) };
  }
}

export async function beautifyCss(code: string, options: BeautifyOptions): Promise<TransformResult> {
  try {
    const { default: beautify } = await import('js-beautify');
    const result = beautify.css(code, {
      indent_size: options.indentSize,
      indent_with_tabs: options.useTabs,
    });
    return { result };
  } catch (err) {
    return { result: '', error: err instanceof Error ? err.message : 'Could not beautify this CSS.' };
  }
}

export async function minifyCss(code: string): Promise<TransformResult> {
  try {
    const { default: CleanCSS } = await import('clean-css');
    const output = new CleanCSS({}).minify(code);
    if (output.errors.length > 0) {
      return { result: '', error: output.errors.join(' ') };
    }
    return { result: output.styles };
  } catch (err) {
    return { result: '', error: err instanceof Error ? err.message : 'Could not minify this CSS.' };
  }
}

export async function beautifyHtml(code: string, options: BeautifyOptions): Promise<TransformResult> {
  try {
    const { default: beautify } = await import('js-beautify');
    const result = beautify.html(code, {
      indent_size: options.indentSize,
      indent_with_tabs: options.useTabs,
    });
    return { result };
  } catch (err) {
    return { result: '', error: err instanceof Error ? err.message : 'Could not beautify this HTML.' };
  }
}

export async function minifyHtml(code: string): Promise<TransformResult> {
  try {
    const { minify } = await import('html-minifier-terser');
    // Deliberately structural-only (no minifyCSS/minifyJS): those options
    // pull html-minifier-terser's own bundled clean-css/terser copies in
    // regardless of what this tool's own dynamic imports do, which would
    // quietly defeat the point of keeping the HTML tab lightweight.
    const result = await minify(code, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      collapseBooleanAttributes: true,
    });
    return { result };
  } catch (err) {
    return { result: '', error: err instanceof Error ? err.message : 'Could not minify this HTML.' };
  }
}

export function getByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const SAMPLE_CODE = {
  javascript: `function calculateOrderTotal(items, taxRate) {
  var subtotal = 0;
  for (var i = 0; i < items.length; i++) {
    subtotal = subtotal + items[i].price * items[i].quantity;
  }
  var tax = subtotal * taxRate;
  return subtotal + tax;
}

var cart = [
  { price: 19.99, quantity: 2 },
  { price: 5.5, quantity: 3 }
];

console.log(calculateOrderTotal(cart, 0.08));`,
  css: `.card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-body {
  color: #666666;
  line-height: 1.5;
}`,
  html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Sample Page</title>
  </head>
  <body>
    <div class="card">
      <h2 class="card-title">Welcome</h2>
      <p class="card-body">This is a sample paragraph used to demonstrate formatting.</p>
    </div>
  </body>
</html>`,
} as const;
