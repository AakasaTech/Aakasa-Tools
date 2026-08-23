/**
 * SSRF guard for the one endpoint in this toolbox that fetches a
 * user-supplied URL server-side. Blocks:
 *  - non-http(s) protocols
 *  - literal private/internal IPv4 and IPv6 addresses (loopback, RFC1918,
 *    link-local — including 169.254.169.254, the common cloud metadata
 *    endpoint — CGNAT, and IPv4-mapped IPv6 forms of the above)
 *  - hostnames that RESOLVE to a private/internal IP via DNS, not just
 *    hostnames that literally spell one out — checking only the string
 *    "localhost" or a raw IP misses a hostname an attacker controls that
 *    simply points its DNS record at an internal address (DNS rebinding)
 *
 * This module only validates one candidate URL — it does not itself follow
 * redirects. The caller (route.ts) must re-validate every redirect target
 * through `validateFetchUrl` before following it, since validating only
 * the initial URL and then blindly following a 3xx response is a classic
 * SSRF bypass.
 */

import dns from 'node:dns/promises';

export interface UrlValidationResult {
  ok: boolean;
  error?: string;
  url?: URL;
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost']);

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return null;
  }
  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const n = Number(part);
    if (n < 0 || n > 255) {
      return null;
    }
    result = (result << 8) | n;
  }
  return result >>> 0;
}

interface CidrRange {
  base: number;
  maskBits: number;
}

function cidr(base: string, maskBits: number): CidrRange {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) {
    throw new Error(`Invalid CIDR base: ${base}`);
  }
  return { base: baseInt, maskBits };
}

function inCidr(ipInt: number, range: CidrRange): boolean {
  if (range.maskBits === 0) {
    return true;
  }
  const mask = range.maskBits === 32 ? 0xffffffff : (~0 << (32 - range.maskBits)) >>> 0;
  return (ipInt & mask) === (range.base & mask);
}

// RFC 1918 private ranges, loopback, link-local (incl. cloud metadata
// 169.254.169.254), CGNAT, "this network", and the 192.0.0.0/24 IANA
// special-purpose block.
const PRIVATE_IPV4_RANGES: CidrRange[] = [
  cidr('0.0.0.0', 8),
  cidr('10.0.0.0', 8),
  cidr('100.64.0.0', 10),
  cidr('127.0.0.0', 8),
  cidr('169.254.0.0', 16),
  cidr('172.16.0.0', 12),
  cidr('192.0.0.0', 24),
  cidr('192.168.0.0', 16),
  cidr('198.18.0.0', 15),
];

function isPrivateIpv4(ip: string): boolean {
  const ipInt = ipv4ToInt(ip);
  if (ipInt === null) {
    return false;
  }
  return PRIVATE_IPV4_RANGES.some((range) => inCidr(ipInt, range));
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') {
    return true;
  }
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]:/.test(lower)) {
    return true;
  }
  // fc00::/7 unique local
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) {
    return true;
  }
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — check the embedded IPv4.
  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(lower);
  if (mapped) {
    return isPrivateIpv4(mapped[1]!);
  }
  return false;
}

export function isPrivateIp(ip: string): boolean {
  return ip.includes(':') ? isPrivateIpv6(ip) : isPrivateIpv4(ip);
}

function isLiteralIp(hostname: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || hostname.includes(':');
}

export async function validateFetchUrl(rawUrl: string): Promise<UrlValidationResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http:// and https:// URLs are supported.' };
  }

  // `URL#hostname` keeps the brackets for an IPv6 literal (e.g. "[::1]",
  // not "::1") — stripping them here is required, not cosmetic: every
  // check below (the literal-IP checks, the private-range checks, the DNS
  // lookup) works against the bracket-free form, and comparing the
  // bracketed string against '::1' etc. silently never matches, letting an
  // IPv6 loopback/link-local URL sail through unblocked.
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { ok: false, error: 'That host is not allowed.' };
  }

  if (isLiteralIp(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, error: 'That host is not allowed.' };
    }
    return { ok: true, url };
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (records.length === 0) {
      return { ok: false, error: 'Could not resolve that host.' };
    }
    if (records.some((record) => isPrivateIp(record.address))) {
      return { ok: false, error: 'That host is not allowed.' };
    }
  } catch {
    return { ok: false, error: 'Could not resolve that host.' };
  }

  return { ok: true, url };
}
