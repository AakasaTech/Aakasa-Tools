/**
 * Pure merge logic — no DOM, no React. Both strategies work on plain
 * `Row[][]` (one array per source dataset, already parsed and with any
 * user-requested column renames already applied by the caller) and know
 * nothing about file names or upload state.
 */

import type { Row } from './parseAnyFormat';

export interface ColumnPresenceInfo {
  column: string;
  /** Indexes into the input `datasets` array that contain this column. */
  presentInDatasets: number[];
  /** Indexes into the input `datasets` array that don't. Empty means the
   * column is present in every dataset. */
  missingFromDatasets: number[];
}

export interface StackRowsResult {
  merged: Row[];
  columnSummary: ColumnPresenceInfo[];
}

export interface MatchStats {
  /** Row count of the primary (first) dataset. */
  primaryRowCount: number;
  /** Rows whose key value matched in every other dataset. */
  matchedInAll: number;
  /** Rows in the final merged output (== matchedInAll for inner joins,
   * == primaryRowCount for left joins). */
  outputRowCount: number;
}

export interface JoinResult {
  merged: Row[];
  matchStats: MatchStats;
}

/** Fills every row so it has exactly `columns`, using '' for any column the
 * row didn't originally have — so cells never silently misalign, and a
 * missing value is visibly empty rather than absent. */
function normalizeToColumns(rows: Row[], columns: string[]): Row[] {
  return rows.map((row) => {
    const normalized: Row = {};
    for (const column of columns) {
      normalized[column] = column in row ? row[column] : '';
    }
    return normalized;
  });
}

/**
 * Appends every dataset's rows into one list. When datasets have differing
 * columns, the output uses the UNION of every column seen across all of
 * them (matching CSV↔JSON Converter's own handling of inconsistent JSON
 * keys) — a row from a file that lacked a given column gets an empty cell
 * for it, rather than the columns misaligning or the column being dropped.
 */
export function stackRows(datasets: Row[][]): StackRowsResult {
  const columnToDatasets = new Map<string, Set<number>>();
  const columnOrder: string[] = [];

  datasets.forEach((rows, datasetIndex) => {
    const columnsInThisDataset = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        columnsInThisDataset.add(key);
      }
    }
    for (const column of columnsInThisDataset) {
      if (!columnToDatasets.has(column)) {
        columnToDatasets.set(column, new Set());
        columnOrder.push(column);
      }
      columnToDatasets.get(column)!.add(datasetIndex);
    }
  });

  const datasetIndexes = datasets.map((_, i) => i);
  const columnSummary: ColumnPresenceInfo[] = columnOrder.map((column) => {
    const present = columnToDatasets.get(column)!;
    return {
      column,
      presentInDatasets: datasetIndexes.filter((i) => present.has(i)),
      missingFromDatasets: datasetIndexes.filter((i) => !present.has(i)),
    };
  });

  const allRows = datasets.flat();
  const merged = normalizeToColumns(allRows, columnOrder);

  return { merged, columnSummary };
}

function stringifyKey(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

/**
 * Joins datasets on a shared key column. `datasets[0]` is the primary/left
 * dataset. 'inner' keeps only rows whose key value is present in EVERY
 * dataset; 'left' keeps every row from the primary dataset, merging in
 * matching data from the others where available and leaving those columns
 * empty where a match doesn't exist.
 */
export function joinOnKey(datasets: Row[][], keyColumn: string, joinType: 'inner' | 'left'): JoinResult {
  const primaryRows = datasets[0] ?? [];

  // One lookup map per non-primary dataset: key value -> its row. A
  // duplicate key within a single dataset keeps its first occurrence,
  // since a join needs exactly one candidate match per side.
  const otherIndexes = datasets.slice(1).map((rows) => {
    const map = new Map<string, Row>();
    for (const row of rows) {
      const key = stringifyKey(row[keyColumn]);
      if (key !== undefined && !map.has(key)) {
        map.set(key, row);
      }
    }
    return map;
  });

  const allColumns: string[] = [];
  const seenColumns = new Set<string>();
  for (const rows of datasets) {
    for (const row of rows) {
      for (const column of Object.keys(row)) {
        if (!seenColumns.has(column)) {
          seenColumns.add(column);
          allColumns.push(column);
        }
      }
    }
  }

  const joinedRows: Row[] = [];
  let matchedInAll = 0;

  for (const primaryRow of primaryRows) {
    const key = stringifyKey(primaryRow[keyColumn]);
    const matches = key === undefined ? [] : otherIndexes.map((index) => index.get(key));
    const matchesAllOthers = otherIndexes.length === 0 || matches.every((match) => match !== undefined);

    if (matchesAllOthers) {
      matchedInAll += 1;
    }

    if (joinType === 'inner' && !matchesAllOthers) {
      continue;
    }

    const mergedRow: Row = { ...primaryRow };
    for (const match of matches) {
      if (match) Object.assign(mergedRow, match);
    }
    joinedRows.push(mergedRow);
  }

  const merged = normalizeToColumns(joinedRows, allColumns);

  return {
    merged,
    matchStats: {
      primaryRowCount: primaryRows.length,
      matchedInAll,
      outputRowCount: merged.length,
    },
  };
}
