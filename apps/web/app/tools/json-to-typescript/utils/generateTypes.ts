/**
 * Pure JSON-value-to-TypeScript-source generation. No React, no DOM — an
 * AST-free recursive string transform, not a real compiler: it walks the
 * *parsed* JSON value (not source text) and builds interface/type-alias
 * declarations directly as strings.
 */

export type DeclarationKind = 'interface' | 'type';
export type OptionalFieldsMode = 'infer' | 'all-optional' | 'all-required';

export interface TypeGenOptions {
  rootName: string;
  declarationKind: DeclarationKind;
  optionalFieldsMode: OptionalFieldsMode;
  semicolons: boolean;
}

export type JsonValueType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';

/** Classifies an already-`JSON.parse`d value. `undefined` can't occur from real JSON, but is folded into 'null' defensively rather than left unhandled. */
export function jsonType(value: unknown): JsonValueType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  return 'object';
}

/** `address` -> `Address`, `user_address` -> `UserAddress`, `user-address` -> `UserAddress`, `userAddress` -> `UserAddress` (already-camelCase input passes through as one word, so only its first letter changes). */
export function toPascalCase(key: string): string {
  const cleaned = key.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!cleaned) {
    return 'Field';
  }
  const pascal = cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return /^[0-9]/.test(pascal) ? `Field${pascal}` : pascal;
}

interface FieldProfile {
  key: string;
  values: unknown[];
  presentInAll: boolean;
}

/** Builds a per-key profile across one or more sample objects — how array-of-object items with partially-overlapping keys, and single objects alike, get their field types and optionality decided. */
function buildObjectProfile(samples: Record<string, unknown>[]): FieldProfile[] {
  const allKeys: string[] = [];
  const seen = new Set<string>();
  for (const sample of samples) {
    for (const key of Object.keys(sample)) {
      if (!seen.has(key)) {
        seen.add(key);
        allKeys.push(key);
      }
    }
  }
  return allKeys.map((key) => {
    const present = samples.filter((sample) => Object.prototype.hasOwnProperty.call(sample, key));
    return { key, values: present.map((sample) => sample[key]), presentInAll: present.length === samples.length };
  });
}

/** A structural signature for one or more object samples merged together — the basis for both array-of-object clustering and cross-key interface reuse (Address generated once, reused wherever the same shape recurs). Independent of field order and of how many samples contributed. */
function profileSignature(samples: Record<string, unknown>[]): string {
  const profile = buildObjectProfile(samples);
  const parts = profile
    .map((field) => {
      const typeFingerprints = Array.from(new Set(field.values.map(fingerprint))).sort();
      return `${field.key}${field.presentInAll ? '' : '?'}:${typeFingerprints.join('|')}`;
    })
    .sort();
  return `{${parts.join(',')}}`;
}

function fingerprint(value: unknown): string {
  const type = jsonType(value);
  if (type === 'object') {
    return profileSignature([value as Record<string, unknown>]);
  }
  if (type === 'array') {
    const items = value as unknown[];
    if (items.length === 0) return '[]';
    const elementFingerprints = Array.from(new Set(items.map(fingerprint))).sort();
    return `[${elementFingerprints.join('|')}]`;
  }
  return type;
}

interface GenContext {
  options: TypeGenOptions;
  declarations: string[];
  fingerprintToName: Map<string, string>;
  usedNames: Set<string>;
}

function reserveName(base: string, ctx: GenContext): string {
  let candidate = base;
  let suffix = 2;
  while (ctx.usedNames.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  ctx.usedNames.add(candidate);
  return candidate;
}

const MAX_ARRAY_VARIANTS = 4;

function generateForValue(value: unknown, keyHint: string, ctx: GenContext): string {
  const type = jsonType(value);
  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
      return type;
    case 'null':
      return 'null';
    case 'array':
      return generateArrayType(value as unknown[], keyHint, ctx);
    case 'object':
      return generateObjectDeclaration([value as Record<string, unknown>], keyHint, ctx);
    default:
      return 'unknown';
  }
}

function generateArrayType(items: unknown[], keyHint: string, ctx: GenContext): string {
  if (items.length === 0) {
    return 'unknown[] /* type could not be inferred from empty array */';
  }

  if (items.every((item) => jsonType(item) === 'object')) {
    return generateObjectArrayType(items as Record<string, unknown>[], keyHint, ctx);
  }

  const distinctElementTypes = Array.from(new Set(items.map((item) => generateForValue(item, keyHint, ctx))));
  const elementType = distinctElementTypes.length === 1 ? distinctElementTypes[0]! : `(${distinctElementTypes.join(' | ')})`;
  return `${elementType}[]`;
}

/**
 * Handles arrays of objects specifically: items are clustered by structural
 * signature first. A single cluster (every item the same shape, or
 * partially-overlapping keys that still resolve to one merged profile) is
 * one interface. A bounded number of genuinely distinct shapes becomes a
 * union of named variants — the "2-3 objects that share some fields but
 * not all" case resolves here, either as one merged interface with
 * optional/unioned fields (if the differences are just presence/null) or
 * as a small union (if the differences are more structural). Beyond
 * MAX_ARRAY_VARIANTS distinct shapes, enumerating each one stops being
 * useful, so it falls back to a generic, honestly-labeled shape instead of
 * either guessing at one item's shape or producing an unreadable union.
 */
function generateObjectArrayType(items: Record<string, unknown>[], keyHint: string, ctx: GenContext): string {
  const clusters = new Map<string, Record<string, unknown>[]>();
  for (const item of items) {
    const fp = profileSignature([item]);
    const group = clusters.get(fp);
    if (group) {
      group.push(item);
    } else {
      clusters.set(fp, [item]);
    }
  }

  if (clusters.size === 1) {
    const [onlyGroup] = Array.from(clusters.values());
    return `${generateObjectDeclaration(onlyGroup!, keyHint, ctx)}[]`;
  }

  if (clusters.size > MAX_ARRAY_VARIANTS) {
    return `Record<string, unknown>[] /* array items have ${clusters.size} different shapes — too varied to type individually; inspect the source data for a precise type */`;
  }

  let variantIndex = 1;
  const variantNames: string[] = [];
  for (const group of clusters.values()) {
    variantNames.push(generateObjectDeclaration(group, `${keyHint}Variant${variantIndex}`, ctx));
    variantIndex += 1;
  }
  return `(${variantNames.join(' | ')})[]`;
}

/** Generates (or reuses) a named interface/type for one or more merged object samples, returning its name. This is the single place new declarations get created — both the array clustering above and the per-field logic below funnel through it, which is what makes cross-key reuse (Q2) and cluster-merging (Q1) fall out of the same mechanism instead of two. */
function generateObjectDeclaration(samples: Record<string, unknown>[], keyHint: string, ctx: GenContext, explicitName?: string): string {
  const signature = profileSignature(samples);
  const existing = ctx.fingerprintToName.get(signature);
  if (existing) {
    return existing;
  }

  const name = reserveName(explicitName ?? toPascalCase(keyHint), ctx);
  ctx.fingerprintToName.set(signature, name);

  const profile = buildObjectProfile(samples);
  const fieldLines = profile.map((field) => generateFieldLine(field, ctx));
  const body = fieldLines.join('\n');
  const semi = ctx.options.semicolons ? ';' : '';

  const declaration =
    ctx.options.declarationKind === 'interface'
      ? `interface ${name} {\n${body}\n}`
      : `type ${name} = {\n${body}\n}${semi}`;

  ctx.declarations.push(declaration);
  return name;
}

function generateFieldLine(field: FieldProfile, ctx: GenContext): string {
  const nonNullValues = field.values.filter((v) => v !== null && v !== undefined);
  const hasNull = field.values.some((v) => v === null || v === undefined);
  const keyHint = toPascalCase(field.key);

  let typeString: string;
  if (nonNullValues.length === 0) {
    typeString = 'unknown';
  } else {
    const kinds = new Set(nonNullValues.map(jsonType));
    if (kinds.size === 1 && kinds.has('object')) {
      typeString = generateObjectDeclaration(nonNullValues as Record<string, unknown>[], keyHint, ctx);
    } else if (kinds.size === 1 && kinds.has('array')) {
      const mergedItems = (nonNullValues as unknown[][]).flat();
      typeString = generateArrayType(mergedItems, keyHint, ctx);
    } else {
      const distinct = Array.from(new Set(nonNullValues.map((v) => generateForValue(v, keyHint, ctx))));
      typeString = distinct.length === 1 ? distinct[0]! : `(${distinct.join(' | ')})`;
    }
  }

  if (hasNull && typeString !== 'unknown') {
    typeString = `${typeString} | null`;
  }

  const optional =
    ctx.options.optionalFieldsMode === 'all-optional'
      ? true
      : ctx.options.optionalFieldsMode === 'all-required'
        ? false
        : !field.presentInAll;

  const semi = ctx.options.semicolons ? ';' : '';
  const keyRendered = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(field.key) ? field.key : JSON.stringify(field.key);
  return `  ${keyRendered}${optional ? '?' : ''}: ${typeString}${semi}`;
}

export function generateTypescript(json: unknown, options: TypeGenOptions): string {
  const ctx: GenContext = {
    options,
    declarations: [],
    fingerprintToName: new Map(),
    usedNames: new Set(),
  };
  const rootName = options.rootName.trim() || 'RootObject';
  const rootType = jsonType(json);
  const semi = options.semicolons ? ';' : '';

  if (rootType === 'object') {
    generateObjectDeclaration([json as Record<string, unknown>], rootName, ctx, rootName);
  } else if (rootType === 'array') {
    // A bare interface can't alias an array or primitive type — a `type`
    // alias is the only valid TS construct here regardless of the
    // interface/type toggle, since `interface X = string[]` isn't legal TS.
    const elementType = generateArrayType(json as unknown[], rootName, ctx);
    const name = reserveName(rootName, ctx);
    ctx.declarations.push(`type ${name} = ${elementType}${semi}`);
  } else {
    const name = reserveName(rootName, ctx);
    ctx.declarations.push(`type ${name} = ${generateForValue(json, rootName, ctx)}${semi}`);
  }

  return ctx.declarations.join('\n\n');
}
