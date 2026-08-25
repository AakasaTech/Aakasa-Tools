import type { Metadata } from 'next';
import { ToolShell } from '@aakasa/tool-shell';
import { SqlFormatter } from './SqlFormatter';

const TITLE = 'SQL Query Formatter - Free Online Tool | Aakasa Toolbox';
const DESCRIPTION = 'Format and beautify SQL queries — entirely in your browser.';
const CANONICAL_URL = 'https://aakasa.dev/tools/sql-formatter';

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

export default function SqlFormatterPage() {
  return (
    <ToolShell
      title="SQL Query Formatter"
      description="Format and beautify SQL queries — entirely in your browser."
      category="developer"
      tier="free"
      relatedTools={['json-formatter', 'regex-tester', 'json-to-typescript']}
      faq={[
        {
          question: 'What does formatting a SQL query actually improve?',
          answer:
            'Mostly readability of anything beyond a trivial single-table query. A query with several JOINs, a nested subquery, or a long WHERE clause with multiple AND/OR conditions is genuinely hard to scan as one dense line or with inconsistent indentation — formatting breaks each clause onto its own line with consistent indentation so the structure is visible at a glance. Consistent keyword casing (all-uppercase, all-lowercase, or left as-is) also matters for teams sharing a codebase, since mixed SELECT/select/Select across a project reads as sloppy even when the query itself is correct.',
        },
        {
          question: 'Which SQL dialects are supported?',
          answer:
            'This tool uses the sql-formatter library, which supports Standard SQL plus dialect-specific formatting for BigQuery, ClickHouse, IBM DB2 and DB2i, DuckDB, Hive, MariaDB, MySQL, N1QL (Couchbase), Oracle PL/SQL, PostgreSQL, Amazon Redshift, Spark SQL, SQLite, TiDB, Trino/Presto, Transact-SQL, SQL Server (T-SQL), SingleStoreDB, and Snowflake. The dialect selector lists exactly these — nothing here is a guess at what the library might support.',
        },
        {
          question: 'Does this tool check whether my query is actually correct?',
          answer:
            "No — this is a scope boundary worth being explicit about. This tool formats SQL syntax: indentation, line breaks, and keyword casing. It does not validate that your query is semantically correct, that the tables and columns you reference exist, or that it would actually run successfully against a real database. A syntactically well-formatted query can still fail against your actual schema — that's a database's job to check, not a formatter's.",
        },
        {
          question: 'Is my SQL stored or transmitted anywhere?',
          answer:
            'No. Formatting happens entirely in your browser using a JavaScript library — nothing is uploaded, logged, or transmitted. This matters more than usual here, since real queries often reference internal table and column names.',
        },
      ]}
    >
      <SqlFormatter />
    </ToolShell>
  );
}
