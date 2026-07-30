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
  if (!rows || rows.length === 0) return [];

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  if (keys.length === 0) return [];

  const labelKey = keys.find(k => k.toLowerCase() === 'label') 
    || keys.find(k => typeof firstRow[k] === 'string') 
    || keys[0];

  const valueKey = keys.find(k => k.toLowerCase() === 'value') 
    || keys.find(k => typeof firstRow[k] === 'number' && k !== labelKey) 
    || keys.find(k => k !== labelKey) 
    || keys[0];

  const groups = new Map<string, number[]>();

  rows.forEach(row => {
    const rawLabel = row[labelKey] ?? row[keys[0]] ?? 'Inconnu';
    const label = String(rawLabel);
    const rawVal = row[valueKey] ?? row[keys[1]] ?? 1;
    const val = typeof rawVal === 'number' ? rawVal : (parseFloat(String(rawVal)) || 1);

    const arr = groups.get(label) ?? [];
    arr.push(val);
    groups.set(label, arr);
  });

  return [...groups.entries()].map(([label, values]) => ({
    label,
    value: values.reduce((s, v) => s + v, 0)
  }));
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

