import { rowsToCsv } from '../../csv-json-converter/utils/jsonToCsv';

export function formatAsJson(records: Record<string, unknown>[]): string {
  return JSON.stringify(records, null, 2);
}

/** Reuses csv-json-converter's row-flattening + CSV serialization core
 * (`rowsToCsv`) rather than reimplementing quoting/escaping — that
 * function already handles the general case (nested values, delimiters,
 * quote characters) via PapaParse, which this tool's flat generated
 * records don't need to duplicate. */
export function formatAsCsv(records: Record<string, unknown>[]): string {
  const result = rowsToCsv(records, { arrayJoinSeparator: '; ' });
  return result.data;
}

function sqlFormatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function formatAsSqlInserts(records: Record<string, unknown>[], tableName: string): string {
  if (records.length === 0) return '';

  const columns = Object.keys(records[0]!);
  const table = sqlIdentifier(tableName.trim() || 'my_table');
  const columnList = columns.map(sqlIdentifier).join(', ');

  const statements = records.map((record) => {
    const values = columns.map((column) => sqlFormatValue(record[column])).join(', ');
    return `INSERT INTO ${table} (${columnList}) VALUES (${values});`;
  });

  return statements.join('\n');
}
