import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { IpSubnetCalculator } from './IpSubnetCalculator';

const TITLE = 'IP Subnet Calculator - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Calculate network address, broadcast, and host range from an IP and CIDR, instantly.';
const CANONICAL_URL = 'https://aakasa.dev/tools/ip-subnet-calculator';

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

export default function IpSubnetCalculatorPage() {
  return (
    <ToolShell
      title="IP Subnet Calculator"
      description="Calculate network address, broadcast, and host range from an IP and CIDR, instantly."
      category="developer"
      tier="free"
      relatedTools={['number-base-converter', 'url-encoder-decoder', 'json-formatter']}
      faq={[
        {
          question: 'What does CIDR notation mean?',
          answer:
            'CIDR (Classless Inter-Domain Routing) notation combines an IP address with a slash and a prefix length, like 192.168.1.0/24 — the prefix length says how many of the address\'s 32 bits are the fixed "network" portion, with the rest free to vary as "host" addresses within that network. A /24 fixes the first 24 bits (the first three octets), leaving the last 8 bits — 256 possible values — for hosts. A smaller number after the slash means a bigger network (more host bits); a bigger number means a smaller network.',
        },
        {
          question: 'What do network address, broadcast address, and usable hosts actually mean?',
          answer:
            'The network address is the first address in the block (all host bits zero) — it identifies the subnet itself, not a specific device. The broadcast address is the last one (all host bits one) — sending to it reaches every device on that subnet. Usable hosts is the count of addresses actually assignable to devices, which for most subnets is the total address count minus 2 (excluding the network and broadcast addresses). Two special cases don\'t follow that rule: a /31 (RFC 3021) has no network or broadcast address at all — both of its 2 addresses are usable, meant for point-to-point links — and a /32 identifies exactly one single host, with no range at all.',
        },
        {
          question: 'What is a subnet mask, and how is it different from CIDR?',
          answer:
            "They're two ways of expressing the same thing. A subnet mask (like 255.255.255.0) is the network portion written out as its own dotted-decimal address — wherever the mask has a 255, that whole byte is network; CIDR notation (/24) just states the count of leading 1 bits instead. This tool accepts either and converts between them automatically.",
        },
        {
          question: 'Is anything I enter here sent anywhere?',
          answer: 'No — every calculation happens locally in your browser.',
        },
      ]}
    >
      <IpSubnetCalculator />
    </ToolShell>
  );
}
