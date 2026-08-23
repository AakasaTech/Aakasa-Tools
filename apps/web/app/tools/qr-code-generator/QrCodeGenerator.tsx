'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Button, FileDropzone } from '@aakasa/ui';
import { generateQrDataUrl, generateQrSvg, type ErrorCorrectionLevel } from './utils/generateQr';
import {
  formatEmailPayload,
  formatSmsPayload,
  formatVCardPayload,
  formatWifiPayload,
  type WifiEncryption,
} from './utils/payloadFormatters';
import { checkContrast } from './utils/contrastCheck';

type ContentTypeId = 'url' | 'wifi' | 'vcard' | 'email' | 'sms';

const CONTENT_TYPES: { id: ContentTypeId; label: string }[] = [
  { id: 'url', label: 'URL / Text' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'vcard', label: 'Contact' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
];

const SIZE_OPTIONS = [256, 512, 1024];

const ERROR_CORRECTION_OPTIONS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: 'L', label: 'L — Low (~7% recovery)' },
  { value: 'M', label: 'M — Medium (~15% recovery)' },
  { value: 'Q', label: 'Q — Quartile (~25% recovery)' },
  { value: 'H', label: 'H — High (~30% recovery)' },
];

const FIELD_CLASSES =
  'w-full rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function QrCodeGenerator() {
  const [contentType, setContentType] = useState<ContentTypeId>('url');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [urlText, setUrlText] = useState('');
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' as WifiEncryption });
  const [vcard, setVcard] = useState({ name: '', phone: '', email: '', org: '' });
  const [email, setEmail] = useState({ address: '', subject: '', body: '' });
  const [sms, setSms] = useState({ number: '', message: '' });

  const [size, setSize] = useState(512);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>('M');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clipboardImageSupported, setClipboardImageSupported] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  useEffect(() => {
    setClipboardImageSupported(
      typeof window !== 'undefined' && 'ClipboardItem' in window && typeof navigator.clipboard?.write === 'function',
    );
  }, []);

  const payload = useMemo(() => {
    switch (contentType) {
      case 'url':
        return urlText.trim();
      case 'wifi':
        return wifi.ssid.trim() ? formatWifiPayload(wifi.ssid.trim(), wifi.password, wifi.encryption) : '';
      case 'vcard':
        return vcard.name.trim() || vcard.phone.trim() || vcard.email.trim()
          ? formatVCardPayload(vcard.name.trim(), vcard.phone.trim(), vcard.email.trim(), vcard.org.trim())
          : '';
      case 'email':
        return email.address.trim() ? formatEmailPayload(email.address.trim(), email.subject.trim(), email.body) : '';
      case 'sms':
        return sms.number.trim() ? formatSmsPayload(sms.number.trim(), sms.message) : '';
      default:
        return '';
    }
  }, [contentType, urlText, wifi, vcard, email, sms]);

  const contrast = useMemo(() => checkContrast(foregroundColor, backgroundColor), [foregroundColor, backgroundColor]);

  useEffect(() => {
    if (!payload) {
      setQrDataUrl(null);
      setGenerationError(null);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    const timer = setTimeout(() => {
      generateQrDataUrl(payload, {
        size,
        foregroundColor,
        backgroundColor,
        errorCorrectionLevel,
        logoDataUrl: logoDataUrl ?? undefined,
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
          setGenerationError(null);
        })
        .catch(() => {
          setQrDataUrl(null);
          setGenerationError('Could not generate a QR code for this input.');
        })
        .finally(() => setIsGenerating(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [payload, size, foregroundColor, backgroundColor, errorCorrectionLevel, logoDataUrl]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % CONTENT_TYPES.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + CONTENT_TYPES.length) % CONTENT_TYPES.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = CONTENT_TYPES.length - 1;
    }
    if (nextIndex !== null) {
      event.preventDefault();
      const nextType = CONTENT_TYPES[nextIndex];
      if (nextType) {
        setContentType(nextType.id);
        tabRefs.current[nextIndex]?.focus();
      }
    }
  }

  async function handleLogoSelected(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    setLogoDataUrl(dataUrl);
    setErrorCorrectionLevel((prev) => (prev === 'L' || prev === 'M' ? 'Q' : prev));
  }

  function handleDownloadPng() {
    if (!qrDataUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'qr-code.png';
    link.click();
  }

  async function handleDownloadSvg() {
    if (!payload) {
      return;
    }
    const svg = await generateQrSvg(payload, {
      size,
      foregroundColor,
      backgroundColor,
      errorCorrectionLevel,
      logoDataUrl: logoDataUrl ?? undefined,
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-code.svg';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyImage() {
    if (!qrDataUrl) {
      return;
    }
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 1500);
    } catch {
      // Clipboard API can reject (permissions, browser quirks) — no-op, same as CopyButton's own handling.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="QR content type" className="flex flex-wrap gap-1 border-b border-ink/10 dark:border-paper/10">
        {CONTENT_TYPES.map((type, index) => (
          <button
            key={type.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            role="tab"
            id={`qr-tab-${type.id}`}
            aria-selected={contentType === type.id}
            aria-controls={`qr-panel-${type.id}`}
            tabIndex={contentType === type.id ? 0 : -1}
            onClick={() => setContentType(type.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              contentType === type.id
                ? 'border-accent text-accent'
                : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-4">
          {contentType === 'url' && (
            <div role="tabpanel" id="qr-panel-url" aria-labelledby="qr-tab-url" className="flex flex-col gap-1.5">
              <label htmlFor="qr-url" className="text-sm font-medium text-ink dark:text-paper">
                URL or text
              </label>
              <input
                id="qr-url"
                type="text"
                value={urlText}
                onChange={(event) => setUrlText(event.target.value)}
                placeholder="https://example.com or any text — a note, a quote, anything"
                className={FIELD_CLASSES}
              />
            </div>
          )}

          {contentType === 'wifi' && (
            <div role="tabpanel" id="qr-panel-wifi" aria-labelledby="qr-tab-wifi" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-wifi-ssid" className="text-sm font-medium text-ink dark:text-paper">
                  Network name (SSID)
                </label>
                <input
                  id="qr-wifi-ssid"
                  type="text"
                  value={wifi.ssid}
                  onChange={(event) => setWifi((prev) => ({ ...prev, ssid: event.target.value }))}
                  placeholder="e.g. HomeNetwork"
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-wifi-encryption" className="text-sm font-medium text-ink dark:text-paper">
                  Security
                </label>
                <select
                  id="qr-wifi-encryption"
                  value={wifi.encryption}
                  onChange={(event) => setWifi((prev) => ({ ...prev, encryption: event.target.value as WifiEncryption }))}
                  className={FIELD_CLASSES}
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None (open network)</option>
                </select>
              </div>
              {wifi.encryption !== 'nopass' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="qr-wifi-password" className="text-sm font-medium text-ink dark:text-paper">
                    Password
                  </label>
                  <input
                    id="qr-wifi-password"
                    type="text"
                    value={wifi.password}
                    onChange={(event) => setWifi((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Network password"
                    className={FIELD_CLASSES}
                  />
                </div>
              )}
            </div>
          )}

          {contentType === 'vcard' && (
            <div role="tabpanel" id="qr-panel-vcard" aria-labelledby="qr-tab-vcard" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-vcard-name" className="text-sm font-medium text-ink dark:text-paper">
                  Name
                </label>
                <input
                  id="qr-vcard-name"
                  type="text"
                  value={vcard.name}
                  onChange={(event) => setVcard((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Jane Doe"
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-vcard-phone" className="text-sm font-medium text-ink dark:text-paper">
                  Phone
                </label>
                <input
                  id="qr-vcard-phone"
                  type="text"
                  value={vcard.phone}
                  onChange={(event) => setVcard((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+1 555 123 4567"
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-vcard-email" className="text-sm font-medium text-ink dark:text-paper">
                  Email
                </label>
                <input
                  id="qr-vcard-email"
                  type="email"
                  value={vcard.email}
                  onChange={(event) => setVcard((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="jane@example.com"
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-vcard-org" className="text-sm font-medium text-ink dark:text-paper">
                  Organization
                </label>
                <input
                  id="qr-vcard-org"
                  type="text"
                  value={vcard.org}
                  onChange={(event) => setVcard((prev) => ({ ...prev, org: event.target.value }))}
                  placeholder="Acme Inc."
                  className={FIELD_CLASSES}
                />
              </div>
            </div>
          )}

          {contentType === 'email' && (
            <div role="tabpanel" id="qr-panel-email" aria-labelledby="qr-tab-email" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-email-address" className="text-sm font-medium text-ink dark:text-paper">
                  Email address
                </label>
                <input
                  id="qr-email-address"
                  type="email"
                  value={email.address}
                  onChange={(event) => setEmail((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="hello@example.com"
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-email-subject" className="text-sm font-medium text-ink dark:text-paper">
                  Subject <span className="text-xs font-normal text-ink/50 dark:text-paper/50">(optional)</span>
                </label>
                <input
                  id="qr-email-subject"
                  type="text"
                  value={email.subject}
                  onChange={(event) => setEmail((prev) => ({ ...prev, subject: event.target.value }))}
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-email-body" className="text-sm font-medium text-ink dark:text-paper">
                  Body <span className="text-xs font-normal text-ink/50 dark:text-paper/50">(optional)</span>
                </label>
                <textarea
                  id="qr-email-body"
                  value={email.body}
                  onChange={(event) => setEmail((prev) => ({ ...prev, body: event.target.value }))}
                  rows={3}
                  className={FIELD_CLASSES}
                />
              </div>
            </div>
          )}

          {contentType === 'sms' && (
            <div role="tabpanel" id="qr-panel-sms" aria-labelledby="qr-tab-sms" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-sms-number" className="text-sm font-medium text-ink dark:text-paper">
                  Phone number
                </label>
                <input
                  id="qr-sms-number"
                  type="text"
                  value={sms.number}
                  onChange={(event) => setSms((prev) => ({ ...prev, number: event.target.value }))}
                  placeholder="+1 555 123 4567"
                  className={FIELD_CLASSES}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-sms-message" className="text-sm font-medium text-ink dark:text-paper">
                  Message <span className="text-xs font-normal text-ink/50 dark:text-paper/50">(optional)</span>
                </label>
                <textarea
                  id="qr-sms-message"
                  value={sms.message}
                  onChange={(event) => setSms((prev) => ({ ...prev, message: event.target.value }))}
                  rows={3}
                  className={FIELD_CLASSES}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">Customize</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-size" className="text-sm font-medium text-ink dark:text-paper">
                  Export size
                </label>
                <select
                  id="qr-size"
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                  className={FIELD_CLASSES}
                >
                  {SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} × {option}px
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-ecl" className="text-sm font-medium text-ink dark:text-paper">
                  Error correction
                </label>
                <select
                  id="qr-ecl"
                  value={errorCorrectionLevel}
                  onChange={(event) => setErrorCorrectionLevel(event.target.value as ErrorCorrectionLevel)}
                  className={FIELD_CLASSES}
                >
                  {ERROR_CORRECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} disabled={!!logoDataUrl && (option.value === 'L' || option.value === 'M')}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-ink/60 dark:text-paper/60">
                  Higher levels tolerate more damage or obstruction (like a logo) at the cost of a denser code.
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-fg-color" className="text-sm font-medium text-ink dark:text-paper">
                  Foreground color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="qr-fg-color"
                    type="color"
                    value={foregroundColor}
                    onChange={(event) => setForegroundColor(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-ink/10 bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:bg-ink"
                  />
                  <span className="font-mono text-xs text-ink/60 dark:text-paper/60">{foregroundColor}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-bg-color" className="text-sm font-medium text-ink dark:text-paper">
                  Background color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="qr-bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-ink/10 bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-paper/10 dark:bg-ink"
                  />
                  <span className="font-mono text-xs text-ink/60 dark:text-paper/60">{backgroundColor}</span>
                </div>
              </div>
            </div>

            {!contrast.sufficient && (
              <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                Low contrast ({contrast.ratio.toFixed(1)}:1) between foreground and background — this code may fail to
                scan. Aim for at least 3:1, and ideally a dark code on a light background.
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink dark:text-paper">
                Logo overlay <span className="text-xs font-normal text-ink/50 dark:text-paper/50">(optional)</span>
              </span>
              {logoDataUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small local preview of an in-memory data URL, not a Next asset */}
                  <img src={logoDataUrl} alt="Logo preview" className="h-10 w-10 rounded border border-ink/10 object-contain dark:border-paper/10" />
                  <Button variant="ghost" size="sm" onClick={() => setLogoDataUrl(null)}>
                    Remove logo
                  </Button>
                </div>
              ) : (
                <FileDropzone
                  onFileSelected={(file) => void handleLogoSelected(file)}
                  accept="image/*"
                  label="Drop a logo image here, or click to browse"
                  hint="PNG or SVG with a transparent background works best"
                />
              )}
              {logoDataUrl && (
                <span className="text-xs text-ink/60 dark:text-paper/60">
                  Error correction was raised to at least Q — a logo covers part of the code, so the extra redundancy
                  keeps it scannable.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center rounded-lg border border-ink/10 bg-[#f5f5f5] p-6 dark:border-paper/10">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static Next asset
              <img src={qrDataUrl} alt="Generated QR code" className="h-56 w-56 object-contain" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-center text-sm text-ink/40">
                {isGenerating ? 'Generating…' : 'Fill in the fields to preview your QR code'}
              </div>
            )}
          </div>

          {generationError && <span className="text-sm text-danger">{generationError}</span>}

          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadPng} disabled={!qrDataUrl}>
              Download PNG
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void handleDownloadSvg()} disabled={!payload}>
              Download SVG
            </Button>
            {clipboardImageSupported && (
              <Button variant="secondary" size="sm" onClick={() => void handleCopyImage()} disabled={!qrDataUrl}>
                {imageCopied ? 'Copied' : 'Copy image'}
              </Button>
            )}
          </div>

          <p className="text-xs text-ink/50 dark:text-paper/50">
            Scan this with your phone&apos;s camera before printing or publishing it — especially if you used a logo
            overlay or custom colors, since both can occasionally produce a code that looks fine but doesn&apos;t
            scan.
          </p>
        </div>
      </div>
    </div>
  );
}
