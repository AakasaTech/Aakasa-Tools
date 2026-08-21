import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { UuidHashGenerator } from './UuidHashGenerator';

const TITLE = 'UUID & Hash Generator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION =
  'Generate UUID v4 identifiers and compute MD5/SHA hashes of text or files — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/uuid-hash-generator';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL_URL,
    siteName: 'Aakasa Toolbox',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function UuidHashGeneratorPage() {
  return (
    <ToolShell
      title="UUID & Hash Generator"
      description="Generate UUIDs and compute cryptographic hashes — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'base64-tool', 'password-generator']}
      faq={[
        {
          question: 'What is a UUID, and why v4 specifically?',
          answer:
            'A UUID (universally unique identifier) is a 128-bit value used to identify something — a database row, a session, a request — without a central authority handing out IDs. Version 4 is generated from random bits, which is what almost every application actually wants. Other versions exist (v1 encodes a timestamp and MAC address, v5 derives an ID deterministically from a namespace and name) but this tool only generates v4, since it covers the overwhelming majority of use cases without the tradeoffs those versions carry.',
        },
        {
          question: 'What is a hash used for here?',
          answer:
            'A hash is a fixed-length fingerprint of some input — the same input always produces the same hash, and changing even one byte changes the hash completely. Common uses: verifying a downloaded file matches a published checksum, deduplicating content, or generating a stable lookup key from arbitrary text.',
        },
        {
          question: 'Is MD5 or SHA-1 safe to use for passwords?',
          answer:
            'No — do not use MD5 or SHA-1 for passwords or anything security-sensitive. Both are cryptographically broken; MD5 in particular has practical collision attacks. This tool includes them only for legacy compatibility and non-security checksums (matching an old git blob hash, for example). SHA-256 and SHA-512 are the right choice for anything where security matters, and even those are the wrong tool for password storage specifically — passwords need a slow, salted algorithm designed for that purpose (bcrypt, scrypt, Argon2), not a general-purpose hash.',
        },
        {
          question: 'Does anything typed or uploaded here leave the browser?',
          answer:
            'No. UUIDs are generated with crypto.randomUUID() and hashes are computed with the Web Crypto API (or a local MD5 implementation, since Web Crypto does not support MD5) — entirely client-side. Files are read and hashed in memory; nothing is uploaded anywhere.',
        },
      ]}
    >
      <UuidHashGenerator />
    </ToolShell>
  );
}
