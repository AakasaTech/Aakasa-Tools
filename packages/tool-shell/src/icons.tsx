import type { SVGProps } from 'react';

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l2.9 6.26 6.9.6-5.2 4.6 1.6 6.79L12 16.9l-6.2 3.35 1.6-6.79-5.2-4.6 6.9-.6L12 2z" />
    </svg>
  );
}
