import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { FileTypeDetector } from './FileTypeDetector';

const TITLE = 'File Type Detector - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = "Detect a file's true type by its content, not just its extension.";
const CANONICAL_URL = 'https://aakasa.dev/tools/file-type-detector';

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

export default function FileTypeDetectorPage() {
  return (
    <ToolShell
      title="File Type Detector"
      description="Detect a file's true type by its content, not just its extension."
      category="data-files"
      tier="free"
      relatedTools={['file-hash-checker', 'base64-tool', 'format-converter']}
      faq={[
        {
          question: 'What is a "magic byte," and why check content instead of the file extension?',
          answer:
            "Most file formats start with a distinctive sequence of bytes — a \"magic number\" or file signature — that identifies the format regardless of what the file is named. A .png always starts with the same 8-byte PNG signature; a .pdf always starts with %PDF. Extensions, by contrast, are just a naming convention: they can be wrong, missing, or deliberately changed. A file's actual binary header reveals its true format no matter what someone renamed it to.",
        },
        {
          question: 'What is this actually useful for?',
          answer:
            "Confirming a downloaded file really is what it claims to be, identifying a file that's lost its extension, or double-checking a file before uploading it somewhere with format restrictions. If a \"resume.pdf\" someone sent you is actually an executable in disguise, this is the kind of check that would catch it.",
        },
        {
          question: 'Does this work for every file type?',
          answer:
            "No — not every format has a detectable binary signature. Plain text files are the main limitation: a .csv, a .txt, and a .md file can be byte-for-byte ambiguous, since there's no header that distinguishes plain text content by format. When that happens, this tool says so plainly rather than guessing or implying it detected something it didn't.",
        },
        {
          question: 'Is anything I upload here sent anywhere?',
          answer: "No — every file is read entirely in your browser and never leaves your device. Nothing about its contents is transmitted anywhere.",
        },
      ]}
    >
      <FileTypeDetector />
    </ToolShell>
  );
}
