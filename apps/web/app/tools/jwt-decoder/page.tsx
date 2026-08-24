import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { JwtDecoder } from './JwtDecoder';

const TITLE = 'JWT Decoder - Free Online Token Inspector | Aakasa Toolbox';
const DESCRIPTION = 'Decode and inspect JWT tokens — header and payload, entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/jwt-decoder';

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

export default function JwtDecoderPage() {
  return (
    <ToolShell
      title="JWT Decoder"
      description="Decode and inspect JWT tokens — header and payload, entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['base64-tool', 'json-formatter', 'timestamp-converter']}
      faq={[
        {
          question: 'Is a JWT encrypted? Is it safe to paste one into a tool like this?',
          answer:
            'A JWT is not encrypted — this is one of the most common misconceptions about them. The header and payload are just JSON, Base64URL-encoded (not encrypted) so they can travel safely inside a URL or header. Anyone who has the token — including this tool, or anyone it was sent to — can decode and read its contents instantly, with no secret key required. That\'s exactly why a JWT payload should never contain sensitive data like a password or a full card number. As for safety: nothing you paste here is stored or transmitted anywhere — decoding happens entirely in your browser using native Web APIs, which matters more than usual for JWTs since they\'re often live session tokens.',
        },
        {
          question: "Why doesn't this tool verify the signature?",
          answer:
            'Verifying a JWT\'s signature requires the actual signing secret (for HMAC algorithms like HS256) or the issuer\'s public key (for RSA/ECDSA algorithms like RS256 or ES256). No legitimate tool should ask you to paste a signing secret or private key into a website, even one that claims to process it only in your browser — that habit is a real security risk regardless of where the key is used. This tool shows you the claimed algorithm and the raw signature bytes, clearly labeled as unverified, but true verification has to happen server-side, in the system that actually holds the signing key.',
        },
        {
          question: 'What do exp, iat, and sub mean in a JWT payload?',
          answer:
            'These are standard registered claims defined by the JWT spec, though none are strictly required. exp (expiration) is a Unix timestamp after which the token should no longer be accepted. iat (issued at) is the Unix timestamp when the token was created. nbf (not before) is a timestamp before which the token isn\'t valid yet. sub (subject) identifies who the token is about, typically a user ID. This tool converts exp/iat/nbf into readable dates automatically so you don\'t have to do that math by hand.',
        },
        {
          question: 'Is anything I paste here stored or sent anywhere?',
          answer:
            'No — this bears repeating for a token tool specifically. All decoding happens locally in your browser; nothing is uploaded, logged, or transmitted. Since JWTs are frequently live authentication or session tokens, treat this the same way you\'d treat any other place you paste one: prefer a short-lived or expired token when just exploring what a JWT looks like, and use the sample token if you just want to see the tool in action.',
        },
      ]}
    >
      <JwtDecoder />
    </ToolShell>
  );
}
