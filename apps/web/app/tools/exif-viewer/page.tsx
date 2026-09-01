import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ExifViewer } from './ExifViewer';

const TITLE = 'EXIF Data Viewer & Remover - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'View and remove hidden metadata, including GPS location, from photos — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/exif-viewer';

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

export default function ExifViewerPage() {
  return (
    <ToolShell
      title="EXIF Data Viewer & Remover"
      description="View and remove hidden metadata, including GPS location, from photos — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-compressor', 'format-converter', 'image-resizer']}
      faq={[
        {
          question: 'What is EXIF data, and what does it usually contain?',
          answer:
            "EXIF is metadata embedded directly in a photo file by the camera or phone that took it — separate from the visible image itself. It commonly includes the camera make and model, capture settings (aperture, shutter speed, ISO, focal length), the exact date and time the photo was taken, and — significantly — the precise GPS coordinates of where it was taken, if location services were enabled on the device.",
        },
        {
          question: "Why would I want to remove this before sharing a photo?",
          answer:
            "Privacy. GPS coordinates embedded in a photo can reveal your home address, workplace, or day-to-day location history to anyone who receives the original file — this isn't a hypothetical risk, it's a genuinely common and well-documented one. Removing metadata before sharing directly (rather than through a platform that already strips it) closes that gap.",
        },
        {
          question: "Don't social media sites already strip this automatically?",
          answer:
            "Most major platforms do strip EXIF data on upload, yes. But direct file sharing — email attachments, messaging apps, cloud file links, or just handing someone the file directly — typically does NOT strip anything. That's exactly the situation this tool is for: whenever a photo leaves your device as an actual file rather than through a platform's upload pipeline.",
        },
        {
          question: 'Is any of this — including my location data — sent anywhere?',
          answer:
            "No, and this is worth stating plainly rather than as a footnote: reading a photo's metadata and removing it both happen entirely on your device. Nothing is uploaded, including any GPS coordinates found — the whole point of this tool is that your location data never has to leave your browser to be dealt with.",
        },
      ]}
    >
      <ExifViewer />
    </ToolShell>
  );
}
