'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  calculateSubnetInfo,
  ipToInt,
  isIpInSubnet,
  isValidIp,
  maskIntToCidr,
  splitSubnet,
  type SubnetInfo,
} from './utils/subnetCalc';

type InputMode = 'cidr' | 'mask';

const SPLIT_PRESETS = [2, 4, 8, 16, 32, 64];

function octetsToBinary(ip: string): string[] {
  return ip.split('.').map((octet) => {
    const n = Number(octet);
    return Number.isFinite(n) ? n.toString(2).padStart(8, '0') : '????????';
  });
}

function BinaryBreakdown({ ip, cidr, label }: { ip: string; cidr: number; label: string }) {
  const octets = octetsToBinary(ip);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-ink/50 dark:text-paper/50">{label}</span>
      <div className="flex flex-wrap gap-2 font-mono text-sm">
        {octets.map((octetBits, octetIndex) => (
          <div key={octetIndex} className="flex rounded border border-ink/10 px-1 py-0.5 dark:border-paper/10">
            {octetBits.split('').map((bit, i) => {
              const globalBitIndex = octetIndex * 8 + i;
              const isNetworkBit = globalBitIndex < cidr;
              return (
                <span key={i} className={isNetworkBit ? 'font-bold text-accent' : 'text-ink/40 dark:text-paper/40'}>
                  {bit}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink/60 dark:text-paper/60">{label}</span>
        <CopyButton value={value} size="sm" />
      </div>
      <span className="font-mono text-sm font-semibold text-ink dark:text-paper">{value}</span>
    </div>
  );
}

export function IpSubnetCalculator() {
  const [ipText, setIpText] = useState('192.168.1.10');
  const [inputMode, setInputMode] = useState<InputMode>('cidr');
  const [cidrText, setCidrText] = useState('24');
  const [maskText, setMaskText] = useState('255.255.255.0');
  const [checkIpText, setCheckIpText] = useState('192.168.1.200');
  const [splitPrefixText, setSplitPrefixText] = useState('26');

  const ipValid = isValidIp(ipText);

  const resolvedCidr: number | null = useMemo(() => {
    if (inputMode === 'cidr') {
      const n = Number(cidrText);
      return Number.isInteger(n) && n >= 0 && n <= 32 ? n : null;
    }
    const maskInt = ipToInt(maskText);
    return maskInt === null ? null : maskIntToCidr(maskInt);
  }, [inputMode, cidrText, maskText]);

  const subnetInfo: SubnetInfo | null = useMemo(() => {
    if (!ipValid || resolvedCidr === null) return null;
    return calculateSubnetInfo(ipText, resolvedCidr);
  }, [ipValid, ipText, resolvedCidr]);

  const checkResult = useMemo(() => {
    if (!subnetInfo || checkIpText.trim() === '') return null;
    if (!isValidIp(checkIpText)) return { valid: false, inSubnet: false };
    return { valid: true, inSubnet: isIpInSubnet(checkIpText, subnetInfo) };
  }, [subnetInfo, checkIpText]);

  const splitPrefix = Number(splitPrefixText);
  const splitValid = subnetInfo !== null && Number.isInteger(splitPrefix) && splitPrefix > subnetInfo.cidr && splitPrefix <= 32;
  const splitCount = splitValid ? 2 ** (splitPrefix - subnetInfo!.cidr) : 0;
  const splitTooLarge = splitCount > 256;
  const subnets: SubnetInfo[] = useMemo(() => {
    if (!subnetInfo || !splitValid || splitTooLarge) return [];
    return splitSubnet(subnetInfo.networkAddress, subnetInfo.cidr, splitPrefix);
  }, [subnetInfo, splitValid, splitTooLarge, splitPrefix]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          IP address
          <input
            type="text"
            value={ipText}
            onChange={(event) => setIpText(event.target.value)}
            spellCheck={false}
            placeholder="192.168.1.10"
            className={`h-10 rounded-md border bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:bg-ink dark:text-paper ${
              ipValid ? 'border-ink/15 dark:border-paper/15' : 'border-danger'
            }`}
          />
          {!ipValid && <span className="text-xs text-danger">Enter a valid IPv4 address, e.g. 192.168.1.10.</span>}
        </label>

        <div className="flex gap-1.5">
          <Button variant={inputMode === 'cidr' ? 'primary' : 'secondary'} size="sm" onClick={() => setInputMode('cidr')}>
            CIDR prefix
          </Button>
          <Button variant={inputMode === 'mask' ? 'primary' : 'secondary'} size="sm" onClick={() => setInputMode('mask')}>
            Subnet mask
          </Button>
        </div>

        {inputMode === 'cidr' ? (
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            CIDR prefix length (0-32)
            <input
              type="text"
              inputMode="numeric"
              value={cidrText}
              onChange={(event) => setCidrText(event.target.value)}
              className={`h-10 w-32 rounded-md border bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:bg-ink dark:text-paper ${
                resolvedCidr !== null ? 'border-ink/15 dark:border-paper/15' : 'border-danger'
              }`}
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
            Subnet mask
            <input
              type="text"
              value={maskText}
              onChange={(event) => setMaskText(event.target.value)}
              spellCheck={false}
              className={`h-10 w-48 rounded-md border bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:bg-ink dark:text-paper ${
                resolvedCidr !== null ? 'border-ink/15 dark:border-paper/15' : 'border-danger'
              }`}
            />
            {resolvedCidr === null && <span className="text-xs text-danger">Not a valid contiguous subnet mask.</span>}
          </label>
        )}
      </div>

      {subnetInfo && (
        <>
          {(subnetInfo.isPointToPoint || subnetInfo.isSingleHost) && (
            <div className="rounded-md bg-accent/10 px-3 py-2 text-xs text-ink dark:text-paper">
              {subnetInfo.isSingleHost
                ? '/32 identifies exactly one host — there is no separate network or broadcast address, and no usable "range."'
                : "/31 (RFC 3021): this 2-address block has no network or broadcast address at all — both addresses are usable point-to-point host addresses, unlike every wider subnet."}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Network address" value={subnetInfo.networkAddress} />
            <StatCard label="Broadcast address" value={subnetInfo.broadcastAddress} />
            <StatCard label="Subnet mask" value={`${subnetInfo.subnetMask} (/${subnetInfo.cidr})`} />
            <StatCard label="Wildcard mask" value={subnetInfo.wildcardMask} />
            <StatCard label="First usable host" value={subnetInfo.firstHost} />
            <StatCard label="Last usable host" value={subnetInfo.lastHost} />
            <StatCard label="Total addresses" value={subnetInfo.totalAddresses.toLocaleString('en-US')} />
            <StatCard label="Usable hosts" value={subnetInfo.usableHostCount.toLocaleString('en-US')} />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <span className="text-sm font-medium text-ink dark:text-paper">Binary breakdown</span>
            <BinaryBreakdown ip={subnetInfo.ip} cidr={subnetInfo.cidr} label={`IP address (${subnetInfo.ip})`} />
            <BinaryBreakdown ip={subnetInfo.subnetMask} cidr={subnetInfo.cidr} label={`Subnet mask (/${subnetInfo.cidr})`} />
            <p className="text-xs text-ink/50 dark:text-paper/50">
              <span className="font-bold text-accent">Bold</span> bits are the network portion (the first {subnetInfo.cidr} bits,
              shared by every address in this subnet); the rest are host bits, free to vary across the {subnetInfo.totalAddresses.toLocaleString('en-US')} addresses in the block.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <span className="text-sm font-medium text-ink dark:text-paper">Check if an IP is in this subnet</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={checkIpText}
                onChange={(event) => setCheckIpText(event.target.value)}
                spellCheck={false}
                placeholder="192.168.1.200"
                className="h-9 w-48 rounded-md border border-ink/15 bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
              />
              {checkResult && (
                <span className={`text-sm ${checkResult.valid && checkResult.inSubnet ? 'text-success' : 'text-danger'}`}>
                  {!checkResult.valid
                    ? 'Not a valid IPv4 address.'
                    : checkResult.inSubnet
                      ? `✓ In range (${subnetInfo.networkAddress}/${subnetInfo.cidr})`
                      : `✗ Not in range (${subnetInfo.networkAddress}/${subnetInfo.cidr})`}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <span className="text-sm font-medium text-ink dark:text-paper">Split this subnet</span>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
                New prefix length
                <input
                  type="text"
                  inputMode="numeric"
                  value={splitPrefixText}
                  onChange={(event) => setSplitPrefixText(event.target.value)}
                  className="h-9 w-24 rounded-md border border-ink/15 bg-paper px-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/15 dark:bg-ink dark:text-paper"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SPLIT_PRESETS.map((count) => {
                  const targetPrefix = subnetInfo.cidr + Math.log2(count);
                  return (
                    <Button key={count} variant="ghost" size="sm" onClick={() => setSplitPrefixText(String(targetPrefix))}>
                      {count} subnets
                    </Button>
                  );
                })}
              </div>
            </div>
            {!splitValid && splitPrefixText.trim() !== '' && (
              <span className="text-xs text-danger">New prefix must be longer than /{subnetInfo.cidr} and at most /32.</span>
            )}
            {splitValid && splitTooLarge && (
              <span className="text-xs text-danger">That would produce {splitCount.toLocaleString('en-US')} subnets — pick a smaller split (256 max).</span>
            )}
            {subnets.length > 0 && (
              <div className="max-h-72 overflow-auto rounded-md border border-ink/10 dark:border-paper/10">
                <table className="w-full min-w-max border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-paper dark:bg-ink">
                    <tr>
                      <th className="border-b border-ink/10 px-2 py-1.5 font-medium text-ink dark:border-paper/10 dark:text-paper">Network</th>
                      <th className="border-b border-ink/10 px-2 py-1.5 font-medium text-ink dark:border-paper/10 dark:text-paper">Host range</th>
                      <th className="border-b border-ink/10 px-2 py-1.5 font-medium text-ink dark:border-paper/10 dark:text-paper">Broadcast</th>
                      <th className="border-b border-ink/10 px-2 py-1.5 font-medium text-ink dark:border-paper/10 dark:text-paper">Usable hosts</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {subnets.map((s) => (
                      <tr key={s.networkAddress} className="border-b border-ink/5 last:border-b-0 dark:border-paper/5">
                        <td className="px-2 py-1.5 text-ink dark:text-paper">
                          {s.networkAddress}/{s.cidr}
                        </td>
                        <td className="px-2 py-1.5 text-ink/70 dark:text-paper/70">
                          {s.firstHost} – {s.lastHost}
                        </td>
                        <td className="px-2 py-1.5 text-ink/70 dark:text-paper/70">{s.broadcastAddress}</td>
                        <td className="px-2 py-1.5 text-ink/70 dark:text-paper/70">{s.usableHostCount.toLocaleString('en-US')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <span className="text-xs text-ink/50 dark:text-paper/50">This tool runs entirely in your browser — nothing you enter is uploaded or stored.</span>
    </div>
  );
}
