import { DataGridConfig } from '@core/models/types';
export const DATA_GRID_DEFAULTS: Required<DataGridConfig> = {
  visibleColumns: [],
  rowsPerPage: 10,
  density: 'compact',
  showToolbar: true,
  showSearch: true,
  showPagination: true,
  showTotals: false,
  sortable: true,
  filterable: true
};
export function resolveDataGridConfig(
  config?: DataGridConfig
): Required<DataGridConfig> {
  return { ...DATA_GRID_DEFAULTS, ...config };
}
export function dataGridAvailableColumns(
  rows: Array<Record<string, unknown>>
): string[] {
  const columns: string[] = [];
  rows.forEach((row) => {
    Object.keys(row).forEach((column) => {
      if (!columns.includes(column)) columns.push(column);
    });
  });
  return columns;
}
export function dataGridVisibleColumns(
  rows: Array<Record<string, unknown>>,
  config?: DataGridConfig
): string[] {
  const available = dataGridAvailableColumns(rows);
  if (!config?.visibleColumns || config.visibleColumns.length === 0) return available;
  return config.visibleColumns.filter((column) => available.includes(column));
}
export function isNumericDataGridColumn(
  rows: Array<Record<string, unknown>>,
  column: string
): boolean {
  const values = rows.map((row) => row[column]).filter((value) => value !== '');
  return values.length > 0 && values.every((value) => typeof value === 'number');
}
export function isDateDataGridColumn(
  rows: Array<Record<string, unknown>>,
  column: string
): boolean {
  const values = rows.map((row) => row[column]).filter(Boolean);
  return (
    values.length > 0 &&
    values.every(
      (value) =>
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}/.test(value) &&
        !Number.isNaN(new Date(value).getTime())
    )
  );
}
export function formatDataGridValue(value: unknown, column: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    const formatted = new Intl.NumberFormat('fr-TN', {
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2
    }).format(value);
    if (/%|taux|ratio/i.test(column)) return `${formatted} %`;
    return /montant|encours|solde|chiffre d'affaires|\bca\b/i.test(column)
      ? `${formatted} TND`
      : formatted;
  }
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  ) {
    return new Date(value).toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  return String(value);
}
export function compareDataGridValues(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  const leftDate =
    typeof left === 'string' && /^\d{4}-\d{2}-\d{2}/.test(left)
      ? new Date(left).getTime()
      : Number.NaN;
  const rightDate =
    typeof right === 'string' && /^\d{4}-\d{2}-\d{2}/.test(right)
      ? new Date(right).getTime()
      : Number.NaN;
  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate))
    return leftDate - rightDate;
  return String(left ?? '').localeCompare(String(right ?? ''), 'fr');
}
