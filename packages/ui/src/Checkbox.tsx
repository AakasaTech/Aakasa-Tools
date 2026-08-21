import type { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/**
 * A labeled checkbox — the "select 0 or more" counterpart to a plain toggle.
 * Extracted after the identical inline `<label><input type="checkbox">`
 * pattern showed up for JSON Formatter's auto-format toggle and Password
 * Generator's five charset checkboxes.
 */
export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-1.5 text-sm text-ink/70 dark:text-paper/70 ${className}`}>
      <input type="checkbox" className="accent-accent" {...props} />
      {label}
    </label>
  );
}
