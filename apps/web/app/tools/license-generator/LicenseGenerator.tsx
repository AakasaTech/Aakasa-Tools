'use client';

import { useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import { LICENSES } from './data/licenses';
import { generateLicenseText } from './utils/generateLicense';

const CURRENT_YEAR = String(new Date().getFullYear());

const COMPARISON_ROWS: { key: 'commercialUse' | 'modification' | 'distribution' | 'patentGrant'; label: string }[] = [
  { key: 'commercialUse', label: 'Commercial use' },
  { key: 'modification', label: 'Modification' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'patentGrant', label: 'Patent grant' },
];

function CheckOrDash({ value }: { value: boolean }) {
  return value ? <span className="text-success">✓</span> : <span className="text-ink/30 dark:text-paper/30">–</span>;
}

export function LicenseGenerator() {
  const [licenseId, setLicenseId] = useState('mit');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [fullName, setFullName] = useState('');
  const [fileName, setFileName] = useState<'LICENSE' | 'LICENSE.md'>('LICENSE');
  const [showComparison, setShowComparison] = useState(false);

  const license = useMemo(() => LICENSES.find((candidate) => candidate.id === licenseId), [licenseId]);

  const output = useMemo(
    () => generateLicenseText(licenseId, { year, fullName }),
    [licenseId, year, fullName]
  );

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 rounded-md border border-ink/10 p-3 dark:border-paper/10">
            {LICENSES.map((candidate) => (
              <label
                key={candidate.id}
                className="flex items-start gap-2 rounded px-1.5 py-1 text-sm text-ink hover:bg-ink/5 dark:text-paper dark:hover:bg-paper/5"
              >
                <input
                  type="radio"
                  name="license"
                  checked={licenseId === candidate.id}
                  onChange={() => setLicenseId(candidate.id)}
                  className="mt-0.5 accent-accent"
                />
                <span>
                  <span className="font-medium">{candidate.name}</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">{candidate.description}</span>
                </span>
              </label>
            ))}
          </div>

          {license?.hasPlaceholders ? (
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
                Year
                <input
                  type="text"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="w-24 rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
                Full name / organization
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-md border border-ink/10 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper"
                />
              </label>
            </div>
          ) : (
            <p className="rounded-md bg-ink/5 px-3 py-2 text-xs text-ink/70 dark:bg-paper/5 dark:text-paper/70">
              {license?.name} doesn&apos;t use a name/year substitution in the LICENSE file itself.
              {(licenseId === 'apache-2.0' || licenseId === 'gpl-3.0') &&
                ' Its official text separately recommends attaching a short copyright notice to each source file — that boilerplate is a different convention from the LICENSE file and isn\'t generated here.'}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowComparison((value) => !value)}
              className="text-xs text-accent underline"
            >
              {showComparison ? 'Hide' : 'Show'} license comparison
            </button>
            {showComparison && (
              <div className="mt-2 overflow-x-auto rounded-md border border-ink/10 dark:border-paper/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 dark:border-paper/10">
                      <th className="p-2 font-medium">License</th>
                      {COMPARISON_ROWS.map((row) => (
                        <th key={row.key} className="p-2 font-medium">
                          {row.label}
                        </th>
                      ))}
                      <th className="p-2 font-medium">Copyleft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LICENSES.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-ink/5 last:border-0 dark:border-paper/5">
                        <td className="p-2">{candidate.name}</td>
                        {COMPARISON_ROWS.map((row) => (
                          <td key={row.key} className="p-2">
                            <CheckOrDash value={candidate.comparison[row.key]} />
                          </td>
                        ))}
                        <td className="p-2">{candidate.comparison.copyleft}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="p-2 text-xs text-ink/50 dark:text-paper/50">
                  A simplified summary for quick orientation — not a substitute for reading the actual license text, and not legal advice.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>{fileName}</span>
            <label className="flex items-center gap-1.5">
              File name
              <select
                value={fileName}
                onChange={(event) => setFileName(event.target.value as 'LICENSE' | 'LICENSE.md')}
                className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-xs text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
              >
                <option value="LICENSE">LICENSE</option>
                <option value="LICENSE.md">LICENSE.md</option>
              </select>
            </label>
          </div>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            aria-label="Generated license text"
            className="h-[32rem] w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none dark:border-paper/10 dark:bg-ink dark:text-paper"
          />
          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download {fileName}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
