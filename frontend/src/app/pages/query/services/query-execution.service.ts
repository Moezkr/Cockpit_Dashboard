import {
  DataQuery,
  FilterOperator,
  QueryJoin,
  QueryTransformation,
  Datum
} from '@core/models/types';
import { RuntimeQueryFilter } from '@pages/dashboard/services/dashboard-filters.service';


export const LIVE_QUERY_DATA: Record<string, Record<string, unknown>[]> = {};
export let CATALOG_SOURCES: any[] = [];

export function setCatalogSources(sources: any[]) {
  CATALOG_SOURCES = sources;
}

export type QueryRow = Record<string, string | number | null | undefined>;

export function getFieldKey(fieldId: string): string {
  if (!fieldId) return '';
  return fieldId;
}


export function executeQueryLocal(
  query: DataQuery,
  rows: any[]
): QueryRow[] {
  return rows as QueryRow[];
}

export function executeDisplayRowsLocal(
  query: DataQuery,
  rows: any[]
): Datum[] {
  return rows as unknown as Datum[];
}

export function executeWidgetRowsLocal(
  query: DataQuery,
  rows: any[]
): Datum[] {
  if (rows.length > 0) {
    if ('label' in rows[0] && 'value' in rows[0]) {
      return rows as Datum[];
    }
    const firstRow = rows[0];
    const labelKey = Object.keys(firstRow).find(k =>
      typeof firstRow[k] === 'string'
    ) ?? Object.keys(firstRow)[0];
    const valueKey = Object.keys(firstRow).find(k =>
      typeof firstRow[k] === 'number'
    ) ?? Object.keys(firstRow)[1];


    const groups = new Map<string, number[]>();
    rows.forEach(row => {
      const label = String(row[labelKey] ?? 'Inconnu');
      const val = Number(row[valueKey]) || 0;
      const arr = groups.get(label) ?? [];
      arr.push(val);
      groups.set(label, arr);
    });
    return [...groups.entries()].map(([label, values]) => ({
      label,
      value: values.reduce((s, v) => s + v, 0)
    }));
  }
  return [];
}


export function executeDisplayRows(
  query: DataQuery,
  runtimeFilters: RuntimeQueryFilter[] = []
): Datum[] {
  const rows = LIVE_QUERY_DATA[query.id] ?? [];
  return executeDisplayRowsLocal(query, rows);
}

export function executeWidgetRows(
  query: DataQuery,
  runtimeFilters: RuntimeQueryFilter[] = []
): Datum[] {
  const rows = LIVE_QUERY_DATA[query.id] ?? [];
  return executeWidgetRowsLocal(query, rows);
}

