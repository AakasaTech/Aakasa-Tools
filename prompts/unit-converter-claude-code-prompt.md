# Claude Code Prompt — Build Tool #9: Unit Converter

Run this after tool-shell and tools #1-8 all exist and work. This should be
a fast, low-risk build after CSV↔JSON's data-handling complexity — mostly
data tables and arithmetic, no tricky parsing or safety concerns.

---

```
Build the Unit Converter tool for the Aakasa Toolbox monorepo.

CONTEXT:
- Route: apps/web/app/tools/unit-converter/
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS
- packages/tool-shell has <ToolShell> (props: title, description, category,
  tier, relatedTools, faq, children) and TOOL_REGISTRY in
  packages/tool-shell/registry.ts — use it, don't rebuild page chrome.
- packages/ui has Button, CopyButton, and other primitives from tools #1-8 —
  check what exists before writing anything new. This tool likely needs a
  searchable dropdown/combobox that may not exist yet (for selecting units
  from potentially long lists) — if built, add it to packages/ui since
  future tools (currency converter, etc.) will want the same pattern.
- 100% client-side. Pure arithmetic — no external libraries needed, all
  conversion factors are well-known constants.
- Design tokens already configured: colors ink/paper/accent/success/danger,
  fonts font-display/font-body/font-mono. Numeric input/output values render
  in font-mono; unit labels use font-body.

STEP 1 — Register the tool:
Add to packages/tool-shell/registry.ts:
  { slug: 'unit-converter', title: 'Unit Converter',
    shortDescription: 'Convert length, weight, temperature, and more, instantly.',
    category: 'calculators', tier: 'free' }

STEP 2 — page.tsx (server component):
- Metadata: title "Unit Converter - Free Online Conversion Tool | Aakasa
  Toolbox", description under 160 chars, canonical URL, OG tags.
- Renders:
  <ToolShell
    title="Unit Converter"
    description="Convert between length, weight, temperature, volume, and more — instantly, in your browser."
    category="calculators"
    tier="free"
    relatedTools={['percentage-calculator', 'bmi-calculator', 'age-calculator']}
    faq={[...]}
  >
    <UnitConverter />
  </ToolShell>
  Note: check TOOL_REGISTRY first — those related tools likely don't exist
  yet. Drop any slug not currently registered.
- Write the faq array: 3-4 Q&A pairs, ~150-200 words, plain factual tone.
  Cover: which unit categories are supported, a note on precision/rounding
  behavior (how many decimal places are shown and why), the distinction
  between temperature conversion (offset-based, not just a multiplier) and
  the other categories (pure ratio-based), and confirmation this tool
  performs all math client-side with no data sent anywhere (low-stakes for
  privacy, but keep the consistent messaging across all 100 tools).

STEP 3 — UnitConverter.tsx (client component, "use client"):
Renders inside ToolShell's card — build only the functional UI:
- Category selector (tabs or a dropdown) for these categories, each with its
  own unit list:
  - Length: mm, cm, m, km, in, ft, yd, mi
  - Weight/Mass: mg, g, kg, metric ton, oz, lb, stone
  - Temperature: Celsius, Fahrenheit, Kelvin
  - Volume: ml, l, cup (US), fl oz (US), pint (US), quart (US), gallon (US),
    gallon (UK) — clearly label US vs UK where they differ, this is a common
    source of user error and worth being explicit about
  - Area: mm², cm², m², km², sq ft, sq yd, acre, hectare
  - Speed: m/s, km/h, mph, knot
  - Data storage: bit, byte, KB, MB, GB, TB (clarify in a small note whether
    this uses 1000-based decimal or 1024-based binary prefixes — pick one,
    decimal/SI is the more broadly expected default for a general tool, and
    say so explicitly since this is a genuine source of confusion)
  - Time: seconds, minutes, hours, days, weeks, months (avg), years
- Two-value layout: "From" value + unit selector, "To" value + unit
  selector, with a swap button (↕ icon) between them that flips both the
  units and which side is being typed into.
- Live conversion as the user types in either field (typing in "From"
  updates "To" and vice versa — this should work bidirectionally, not just
  From→To).
- Unit selectors should be searchable/filterable if the list for a category
  is long (data storage, or if you add more units later) — a simple
  type-to-filter combobox, not necessarily a heavy library component.
- Precision control: a small "decimal places" stepper/selector (default 2-4
  depending on category — temperature and small-to-large conversions like
  mm→km need different sensible defaults; don't hardcode one value across
  all categories) so users converting for different precision needs (a
  recipe vs. an engineering calculation) aren't stuck with an arbitrary
  fixed precision.
- CopyButton on the result value.
- "Common conversions" quick-reference chips below the converter for the
  active category (e.g. for Length: "1 mile = 1.609 km", "1 inch = 2.54 cm")
  — clicking one loads that conversion into the tool. This adds SEO-relevant
  content depth and genuine quick-reference utility.
- Clear/reset button that returns to a sensible default (e.g. 1 of the first
  unit in the category).

STEP 4 — Logic separation:
Extract into apps/web/app/tools/unit-converter/utils/:
  - unitDefinitions.ts — a typed registry of all categories/units/conversion
    factors. For ratio-based categories (length, weight, volume, area,
    speed, data, time), store each unit's factor relative to a base unit
    (e.g. meters for length) so conversion is a simple multiply/divide
    through the base unit rather than a combinatorial factor table. For
    temperature specifically, since it's offset-based not pure-ratio, handle
    it as a distinct special case with explicit toCelsius/fromCelsius
    functions per unit rather than forcing it into the same
    multiply-through-base-unit pattern (this would produce silently wrong
    results if temperature is treated like the others — call this out as a
    deliberate architectural difference in a code comment).
  - convert.ts — convert(value: number, fromUnit: string, toUnit: string,
    category: UnitCategory): number, dispatching to the ratio-based or
    temperature-specific logic depending on category. Pure, typed, no `any`.
  Both unit-testable independently — temperature conversion in particular
  should have explicit test cases in mind (0°C = 32°F = 273.15K) since a
  sign or offset error here is easy to make and easy to miss visually.

STEP 5 — Verify:
Confirm the tool appears on the toolbox index/listing page automatically via
the registry entry.

After building, tell me:
1. Confirm temperature conversion is correct at the well-known reference
   points (0°C = 32°F = 273.15K, 100°C = 212°F = 373.15K) — state the actual
   computed values, don't just assert it's correct.
2. Whether a searchable combobox component got built for the unit selectors,
   and if so, whether it's generic enough to move into packages/ui now,
   given a future Currency Converter tool will very likely want the same
   pattern for selecting from a long currency list.
3. Which decimal-precision default was chosen for each category and why —
   flag any category where the default felt like a judgment call worth a
   second opinion.
```

---

## Notes

- **Temperature is the one trap in this tool** — every other category is a
  pure multiplicative ratio (multiply by a factor, optionally through a base
  unit), but Celsius/Fahrenheit/Kelvin involve offsets, not just scaling. If
  Claude Code tries to force temperature into the same "factor relative to a
  base unit" table as everything else, it will produce subtly wrong results
  for values other than the reference points. The prompt calls this out
  explicitly and asks for the reference-point values to be stated back,
  specifically so this doesn't slip through unverified.
- **Data storage units (KB/MB/GB) are a smaller trap** — decimal (1000-based,
  SI) vs. binary (1024-based, historically common in OS file sizes) prefixes
  genuinely disagree, and there's no single "correct" answer, just a choice
  that needs to be stated clearly to the user rather than silently assumed.
- The **searchable combobox** built here is flagged as a likely candidate for
  `packages/ui`, since Currency Converter (from your original 100-tool list)
  will need the same "pick one item from a long list" pattern — same kind of
  reuse question raised on tools #7 and #8.
