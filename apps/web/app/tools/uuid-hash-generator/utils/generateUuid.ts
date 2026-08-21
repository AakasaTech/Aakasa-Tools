export interface UuidOptions {
  hyphens: boolean;
  uppercase: boolean;
}

/**
 * Generates a UUID v4 (random) via crypto.randomUUID() — never a
 * hand-rolled random-number scheme. This tool only ever produces v4; it
 * doesn't support v1 (timestamp-based) or v5 (namespace-based).
 */
export function generateUuidV4(options: UuidOptions): string {
  let uuid: string = crypto.randomUUID();
  if (!options.hyphens) {
    uuid = uuid.replace(/-/g, '');
  }
  if (options.uppercase) {
    uuid = uuid.toUpperCase();
  }
  return uuid;
}
