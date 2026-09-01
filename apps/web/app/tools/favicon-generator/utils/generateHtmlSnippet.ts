/** The exact `<link>` tags that turn the generated files into a working
 * favicon setup once pasted into the page's `<head>` — closing the loop
 * from "here are some files" to "here's how to actually use them". */
export function buildFaviconHtmlTags(): string {
  return [
    '<link rel="icon" type="image/x-icon" href="/favicon.ico" />',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    '<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
  ].join('\n');
}
