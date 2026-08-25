'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, CopyButton } from '@aakasa/ui';
import {
  formatQuery,
  getByteSize,
  supportedDialects,
  SAMPLE_SQL,
  type IndentStyle,
  type KeywordCase,
} from './utils/formatSql';

const DIALECT_LABELS: Record<string, string> = {
  sql: 'Standard SQL',
  bigquery: 'BigQuery',
  clickhouse: 'ClickHouse',
  db2: 'IBM DB2',
  db2i: 'IBM DB2i',
  duckdb: 'DuckDB',
  hive: 'Hive',
  mariadb: 'MariaDB',
  mysql: 'MySQL',
  n1ql: 'N1QL (Couchbase)',
  plsql: 'Oracle PL/SQL',
  postgresql: 'PostgreSQL',
  redshift: 'Amazon Redshift',
  spark: 'Spark SQL',
  sqlite: 'SQLite',
  tidb: 'TiDB',
  trino: 'Trino (Presto)',
  transactsql: 'Transact-SQL',
  tsql: 'SQL Server (T-SQL)',
  singlestoredb: 'SingleStoreDB',
  snowflake: 'Snowflake',
};

const KEYWORD_CASE_LABELS: Record<KeywordCase, string> = {
  preserve: 'Preserve',
  upper: 'UPPERCASE',
  lower: 'lowercase',
};

const INDENT_STYLE_LABELS: Record<IndentStyle, string> = {
  standard: 'Standard',
  tabularLeft: 'Tabular (left-aligned)',
  tabularRight: 'Tabular (right-aligned)',
};

const textareaClasses =
  'h-80 w-full resize-y rounded-md border border-ink/10 bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent dark:border-paper/10 dark:bg-ink dark:text-paper';

export function SqlFormatter() {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [dialect, setDialect] = useState('sql');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('preserve');
  const [indentSize, setIndentSize] = useState(2);
  const [indentStyle, setIndentStyle] = useState<IndentStyle>('standard');
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const outcome = useMemo(() => {
    if (!debouncedInput.trim()) return null;
    return formatQuery(debouncedInput, dialect, { keywordCase, indentSize, indentStyle, compact });
  }, [debouncedInput, dialect, keywordCase, indentSize, indentStyle, compact]);

  const output = outcome && !outcome.error ? outcome.result : '';
  const error = outcome?.error;

  function handleLoadSample() {
    setInput(SAMPLE_SQL);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.sql';
    link.click();
    URL.revokeObjectURL(url);
  }

  const inputStats = useMemo(() => ({ chars: input.length, bytes: getByteSize(input) }), [input]);
  const outputStats = useMemo(() => ({ chars: output.length, bytes: getByteSize(output) }), [output]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Dialect
          <select
            value={dialect}
            onChange={(event) => setDialect(event.target.value)}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            {supportedDialects.map((key) => (
              <option key={key} value={key}>
                {DIALECT_LABELS[key] ?? key}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Keyword case
          <select
            value={keywordCase}
            onChange={(event) => setKeywordCase(event.target.value as KeywordCase)}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            {(Object.keys(KEYWORD_CASE_LABELS) as KeywordCase[]).map((key) => (
              <option key={key} value={key}>
                {KEYWORD_CASE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Indent size
          <select
            value={indentSize}
            onChange={(event) => setIndentSize(Number(event.target.value))}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink/70 dark:text-paper/70">
          Layout style
          <select
            value={indentStyle}
            onChange={(event) => setIndentStyle(event.target.value as IndentStyle)}
            className="rounded-md border border-ink/10 bg-paper px-2 py-1 text-sm text-ink dark:border-paper/10 dark:bg-ink dark:text-paper"
          >
            {(Object.keys(INDENT_STYLE_LABELS) as IndentStyle[]).map((key) => (
              <option key={key} value={key}>
                {INDENT_STYLE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <Button variant={compact ? 'primary' : 'secondary'} size="sm" onClick={() => setCompact((prev) => !prev)}>
          {compact ? 'Compact: on' : 'Compact: off'}
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLoadSample}>
            Sample
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>SQL input</span>
            <span>
              {inputStats.chars.toLocaleString()} chars &middot; {inputStats.bytes.toLocaleString()} bytes
            </span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder="Paste a SQL query here…"
            aria-label="SQL input"
            aria-invalid={!!error}
            className={textareaClasses}
          />
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-ink/50 dark:text-paper/50">
            <span>Formatted SQL</span>
            <span>
              {outputStats.chars.toLocaleString()} chars &middot; {outputStats.bytes.toLocaleString()} bytes
            </span>
          </div>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Formatted query will appear here…"
            aria-label="Formatted SQL output"
            className={textareaClasses}
          />
          <div className="flex items-center gap-2">
            <CopyButton value={output} disabled={!output} />
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!output}>
              Download .sql
            </Button>
          </div>
        </div>
      </div>

      <span className="text-xs text-ink/50 dark:text-paper/50">
        Nothing you paste here is stored or transmitted — formatting happens entirely in your browser.
      </span>
    </div>
  );
}
