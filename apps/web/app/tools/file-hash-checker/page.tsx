import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FileHashChecker } from './FileHashChecker';

const TITLE = 'File Hash Checker - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = "Verify a file's integrity by checking its hash against an expected value.";
const CANONICAL_URL = 'https://aakasa.dev/tools/file-hash-checker';

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

export default function FileHashCheckerPage() {
  return (
    <ToolShell
      title="File Hash Checker"
      description="Verify a file's integrity by checking its hash against an expected value."
      category="data-files"
      tier="free"
      relatedTools={['uuid-hash-generator', 'base64-tool', 'csv-viewer']}
      faq={[
        {
          question: 'What does a file hash checksum actually verify?',
          answer:
            "It confirms a file is byte-for-byte identical to the original it was hashed against — nothing more, nothing less. Even a single changed byte produces a completely different hash, so it's a reliable way to confirm a large download wasn't corrupted in transit, or that a file hasn't been altered since the hash was published. This is commonly used after downloading software, disk images, or archives.",
        },
        {
          question: 'Which hash algorithm should I use?',
          answer:
            "Whichever one the file's source published — this tool doesn't decide that for you, it just needs to match. SHA-256 is the most common modern standard. MD5 and SHA-1 are older and are considered cryptographically weak — practical collision attacks exist for both, so they're not trustworthy for resisting a determined attacker who wants to forge a matching hash. They're still commonly published and are fine for basic integrity/corruption checking (confirming an honest download wasn't mangled), just not for tamper-resistance against someone actively trying to fool you.",
        },
        {
          question: 'How do I actually use this?',
          answer:
            "Drop the file you downloaded above, pick the algorithm the source used (check the download page or release notes), then paste the hash value published alongside the file into the \"Expected hash\" field. The tool computes your file's actual hash and compares it for you — a clear MATCH or NO MATCH, no manual character-by-character comparison needed.",
        },
        {
          question: 'Is anything I upload here sent anywhere?',
          answer:
            "No — every file is hashed entirely in your browser and never leaves your device. That matters if you're verifying something sensitive, since nothing about the file's contents is transmitted anywhere in the process.",
        },
      ]}
    >
      <FileHashChecker />
    </ToolShell>
  );
}
