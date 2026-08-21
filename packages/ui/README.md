# @aakasa/ui

Shared design primitives for every tool in the Aakasa Toolbox.

## What's here

- `Button` — `primary` / `secondary` / `ghost` variants, `sm` / `md` sizes. Added
  building the JSON Formatter, which needed consistent styling across half a dozen
  action buttons (Format, Minify, Clear, Sample, view toggle).
- `CopyButton` — wraps `Button`, copies a string to the clipboard, and briefly shows
  a "Copied" state. No toast library.

`FileDropzone` and `Card` don't exist yet — add them here when a tool actually needs
one, not ahead of time.

## Usage

```tsx
import { Button, CopyButton } from '@aakasa/ui';

<Button variant="secondary" size="sm" onClick={...}>Minify</Button>
<CopyButton value={output} />
```
