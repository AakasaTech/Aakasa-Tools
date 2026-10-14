/**
 * Pure IPv4/CIDR bitwise math — no DOM, no React.
 *
 * IP addresses are represented as plain JS `number`s holding the
 * UNSIGNED 32-bit value (0 to 4294967295) throughout. JS's bitwise
 * operators (`&`, `|`, `~`, `<<`) all convert their operands to 32-bit
 * SIGNED integers internally and produce a signed result — so for any
 * address with the top bit set (192.0.0.0 and above, i.e. more than half
 * of all IPv4 space), a raw bitwise result would read back as a negative
 * number. Every bitwise expression here is immediately followed by
 * `>>> 0` (unsigned right shift by zero), which reinterprets that same
 * 32-bit pattern as unsigned without changing a single bit — the
 * standard, correct fix for exactly this class of bug.
 */

const MAX_UINT32 = 0xffffffff;

export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    // Plain arithmetic (not bitwise) while accumulating — this alone
    // never risks the signed-32-bit bitwise pitfall described above.
    result = result * 256 + n;
  }
  return result;
}

export function intToIp(int: number): string {
  const value = int >>> 0;
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff].join('.');
}

export function isValidIp(ip: string): boolean {
  return ipToInt(ip) !== null;
}

/** The subnet mask, as an unsigned 32-bit int, for a given CIDR prefix
 * length (0-32). Guards `cidr === 0` explicitly: JS's `<<` computes its
 * shift amount modulo 32, so `x << 32` is actually `x << 0` (a no-op) —
 * without this guard, a /0 mask would incorrectly compute as
 * 255.255.255.255 instead of 0.0.0.0. */
export function cidrToMaskInt(cidr: number): number {
  if (cidr <= 0) return 0;
  if (cidr >= 32) return MAX_UINT32;
  return (MAX_UINT32 << (32 - cidr)) >>> 0;
}

export function maskIntToCidr(maskInt: number): number | null {
  const value = maskInt >>> 0;
  // A valid mask is some number of leading 1 bits followed by all 0
  // bits — i.e. (mask | (mask - 1)) recreates all-1s only for a
  // contiguous leading run; equivalently, check against the CIDR built
  // from the popcount of leading ones.
  let cidr = 0;
  let remaining = value;
  while ((remaining & 0x80000000) !== 0) {
    cidr += 1;
    remaining = (remaining << 1) >>> 0;
  }
  return cidrToMaskInt(cidr) === value ? cidr : null;
}

export interface SubnetInfo {
  ip: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHostCount: number;
  /** RFC 3021: a /31 has no network/broadcast address — both addresses
   * in the block are usable point-to-point host addresses. */
  isPointToPoint: boolean;
  /** A /32 identifies exactly one host, with no usable "range" at all. */
  isSingleHost: boolean;
}

export function calculateSubnetInfo(ip: string, cidr: number): SubnetInfo | null {
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) return null;
  const ipInt = ipToInt(ip);
  if (ipInt === null) return null;

  const maskInt = cidrToMaskInt(cidr);
  const wildcardInt = ~maskInt >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;
  const totalAddresses = 2 ** (32 - cidr);

  const isSingleHost = cidr === 32;
  const isPointToPoint = cidr === 31;

  let firstHostInt: number;
  let lastHostInt: number;
  let usableHostCount: number;

  if (isSingleHost) {
    // /32: the address itself is the one and only usable host.
    firstHostInt = networkInt;
    lastHostInt = networkInt;
    usableHostCount = 1;
  } else if (isPointToPoint) {
    // /31 (RFC 3021): no network/broadcast role — both of the block's two
    // addresses are usable point-to-point host addresses.
    firstHostInt = networkInt;
    lastHostInt = broadcastInt;
    usableHostCount = 2;
  } else {
    firstHostInt = (networkInt + 1) >>> 0;
    lastHostInt = (broadcastInt - 1) >>> 0;
    usableHostCount = totalAddresses - 2;
  }

  return {
    ip,
    cidr,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    totalAddresses,
    usableHostCount,
    isPointToPoint,
    isSingleHost,
  };
}

export function isIpInSubnet(ip: string, networkCidr: SubnetInfo): boolean {
  const ipInt = ipToInt(ip);
  if (ipInt === null) return false;
  const maskInt = cidrToMaskInt(networkCidr.cidr);
  const networkInt = ipToInt(networkCidr.networkAddress);
  if (networkInt === null) return false;
  return ((ipInt & maskInt) >>> 0) === networkInt;
}

const MAX_SPLIT_SUBNETS = 4096;

/**
 * Splits `network`/`cidr` into subnets of `newPrefixLength` each (which
 * must be a longer/more-specific prefix than `cidr`), aligned to the
 * original network's boundary and covering it exactly and contiguously —
 * subnet N starts immediately where subnet N-1 ends, with no gap and no
 * overlap, since each is just `network + N × subnetSize`.
 */
export function splitSubnet(network: string, cidr: number, newPrefixLength: number): SubnetInfo[] {
  if (!Number.isInteger(newPrefixLength) || newPrefixLength <= cidr || newPrefixLength > 32) return [];
  const baseInt = ipToInt(network);
  if (baseInt === null) return [];

  const alignedBaseInt = (baseInt & cidrToMaskInt(cidr)) >>> 0;
  const subnetCount = 2 ** (newPrefixLength - cidr);
  if (subnetCount > MAX_SPLIT_SUBNETS) return [];
  const subnetSize = 2 ** (32 - newPrefixLength);

  const subnets: SubnetInfo[] = [];
  for (let i = 0; i < subnetCount; i += 1) {
    const subnetStartInt = (alignedBaseInt + i * subnetSize) >>> 0;
    const info = calculateSubnetInfo(intToIp(subnetStartInt), newPrefixLength);
    if (info) subnets.push(info);
  }
  return subnets;
}
