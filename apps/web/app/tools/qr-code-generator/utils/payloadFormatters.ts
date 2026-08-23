/**
 * Pure payload-string formatters for each QR content type. No React, no
 * DOM — each function just turns typed fields into the exact string format
 * a phone's camera app expects to recognize (join Wi-Fi, save contact,
 * compose email/SMS) rather than showing it as plain scanned text.
 */

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

/**
 * Escapes characters that are structurally significant in the WIFI: QR
 * format (`\`, `;`, `,`, `:`, `"`) by prefixing them with a backslash, per
 * the de facto Wi-Fi QR spec used by Android/iOS camera apps. Unescaped
 * special characters in an SSID or password are the most common reason a
 * Wi-Fi QR code scans as text instead of offering to join the network.
 */
function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Formats `WIFI:T:<encryption>;S:<ssid>;P:<password>;;` — the standard
 * payload phone camera apps parse into a "Join network?" prompt. Open
 * networks omit the P field entirely rather than sending an empty one.
 */
export function formatWifiPayload(ssid: string, password: string, encryption: WifiEncryption): string {
  const escapedSsid = escapeWifiField(ssid);
  if (encryption === 'nopass') {
    return `WIFI:T:nopass;S:${escapedSsid};;`;
  }
  const escapedPassword = escapeWifiField(password);
  return `WIFI:T:${encryption};S:${escapedSsid};P:${escapedPassword};;`;
}

/**
 * Escapes characters that are structurally significant in vCard field
 * values (`\`, `,`, `;`, and newlines), per RFC 2426 §5.8.4.
 */
function escapeVCardField(value: string): string {
  return value.replace(/([\\,;])/g, '\\$1').replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Formats a minimal vCard 3.0 record. Only a single "name" field is
 * collected (no separate given/family inputs), so N: is left empty and
 * FN: — the property contact apps actually display — carries the full
 * name; this is what most contact-info QR generators do absent a
 * first/last split, and both iOS and Android read FN correctly. Uses CRLF
 * line endings as RFC 2426 requires, since some stricter vCard parsers
 * reject bare LF.
 */
export function formatVCardPayload(name: string, phone: string, email: string, org: string): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  if (name) {
    lines.push(`N:;${escapeVCardField(name)};;;`);
    lines.push(`FN:${escapeVCardField(name)}`);
  }
  if (org) {
    lines.push(`ORG:${escapeVCardField(org)}`);
  }
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardField(phone)}`);
  }
  if (email) {
    lines.push(`EMAIL:${escapeVCardField(email)}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Formats a `mailto:` URI per RFC 6068. Subject/body are omitted from the
 * query string when empty. Uses `encodeURIComponent` rather than
 * `URLSearchParams` deliberately — `URLSearchParams` form-encodes spaces as
 * `+`, which is correct for HTML form submissions but not for a mailto URI,
 * where a mail client should see `%20` and a literal `+` would otherwise
 * risk showing up unencoded in the subject/body.
 */
export function formatEmailPayload(address: string, subject: string, body: string): string {
  const params: string[] = [];
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }
  const query = params.join('&');
  return query ? `mailto:${address}?${query}` : `mailto:${address}`;
}

/** Formats an `sms:` URI per RFC 5724. The body param is omitted when the message is empty. */
export function formatSmsPayload(number: string, message: string): string {
  if (!message) {
    return `sms:${number}`;
  }
  return `sms:${number}?body=${encodeURIComponent(message)}`;
}
