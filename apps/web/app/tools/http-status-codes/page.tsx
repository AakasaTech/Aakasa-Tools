import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { HttpStatusCodes } from './HttpStatusCodes';

const TITLE = 'HTTP Status Code Reference - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Look up HTTP status codes and their meanings — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/http-status-codes';

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

export default function HttpStatusCodesPage() {
  return (
    <ToolShell
      title="HTTP Status Code Reference"
      description="Look up HTTP status codes and their meanings — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['curl-to-code', 'json-formatter', 'regex-tester']}
      faq={[
        {
          question: 'How are status codes grouped into classes?',
          answer:
            "By their first digit. 1xx (Informational) are interim responses sent before the real answer. 2xx (Success) means the request did what it was supposed to. 3xx (Redirection) means go look somewhere else. 4xx (Client Error) means the request itself was the problem — bad input, missing auth, hitting a rate limit. 5xx (Server Error) means the server is the one that failed, not the request.",
        },
        {
          question: '401 vs. 403 — what\'s the actual difference?',
          answer:
            'This is the single most commonly mixed-up pair. 401 Unauthorized means "I don\'t know who you are, or the credentials you gave me aren\'t valid — authenticate first." 403 Forbidden means "I know exactly who you are, and you\'re not allowed to do this." If logging in again would fix the problem, it\'s 401; if logging in again wouldn\'t change anything because the account just doesn\'t have permission, it\'s 403.',
        },
        {
          question: '301 vs. 302/307/308 — which redirect should I use?',
          answer:
            "301 and 308 are permanent — browsers and search engines cache them aggressively and will remember the new URL going forward, which is right for things like a domain migration but risky for anything you might need to change again. 302 and 307 are temporary and shouldn't be cached the same way. Separately, 301 and 302 technically leave the follow-up request's HTTP method ambiguous (some clients turn a POST into a GET), while 307 and 308 explicitly preserve whatever method the original request used — use those two when the redirect needs to keep a POST a POST.",
        },
        {
          question: 'Does this cover every status code that exists?',
          answer:
            "It covers the official IANA-registered codes that developers actually run into day to day — not every code some server or CDN has ever informally used. A few well-known unofficial ones (like 418 \"I'm a teapot\", which started as an April Fools' joke) are deliberately left out for that reason. And of course: everything here runs locally in your browser, nothing is sent anywhere.",
        },
      ]}
    >
      <HttpStatusCodes />
    </ToolShell>
  );
}
