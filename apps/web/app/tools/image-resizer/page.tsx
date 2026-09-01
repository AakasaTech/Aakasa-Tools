import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { ImageResizer } from './ImageResizer';

const TITLE = 'Image Resizer & Cropper - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Resize and crop images to exact dimensions — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/image-resizer';

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

export default function ImageResizerPage() {
  return (
    <ToolShell
      title="Image Resizer & Cropper"
      description="Resize and crop images to exact dimensions — entirely in your browser."
      category="image"
      tier="free"
      relatedTools={['image-compressor', 'format-converter', 'placeholder-image-generator']}
      faq={[
        {
          question: "What's the difference between resizing and cropping?",
          answer:
            'Resizing scales the whole image up or down — every pixel stays, just at a new size. Cropping keeps a portion of the image at its original scale and discards the rest. If your target dimensions have a different aspect ratio than your source image, resizing without cropping will stretch it; cropping first, then resizing, avoids that distortion.',
        },
        {
          question: '"Lock aspect ratio" — what does that actually do?',
          answer:
            "It keeps width and height changing together in the same proportion as your original image, so editing one automatically adjusts the other. Without it, setting a width and height that don't match your image's proportions will visibly stretch or squash the result — locking it is what prevents that.",
        },
        {
          question: 'Where do the preset sizes come from?',
          answer:
            'Common social platform and display requirements — Instagram posts and stories, a YouTube thumbnail, a LinkedIn banner, standard desktop wallpaper resolutions, and similar — so you don\'t have to look up exact pixel dimensions separately before resizing or cropping.',
        },
        {
          question: 'Is my image uploaded anywhere?',
          answer: 'No. Resizing and cropping both happen entirely in your browser — nothing is sent anywhere.',
        },
      ]}
    >
      <ImageResizer />
    </ToolShell>
  );
}
