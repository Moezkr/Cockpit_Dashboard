import { FilterOperator, GlobalFilter, WidgetFilter } from '@core/models/types';
export interface RuntimeQueryFilter {
  fieldId?: string;
  field?: string;
  operator: FilterOperator;
  value: any;
}
export interface ActiveDashboardFilter {
  id: string;
  fieldId: string;
  label: string;
  value: string;
}
export function resolveDashboardRuntimeFilters(
  filters: GlobalFilter[],
  values: Record<string, string>
): RuntimeQueryFilter[] {
  return filters.flatMap((filter): RuntimeQueryFilter[] => {
    const selection = (values[filter.id] ?? filter.defaultValue).trim();
    if (!selection || isUniversalSelection(selection)) return [];
    const mappedValue = filter.valueMap?.[selection] ?? selection;
    if (filter.input === 'daterange') {
      const [start = '', end = ''] = Array.isArray(mappedValue)
        ? mappedValue
        : typeof mappedValue === 'string'
          ? mappedValue.split(',').map((value) => value.trim())
          : ['', ''];
      return start || end
        ? [
            {
              fieldId: filter.fieldId || 'GLOBAL_DATE_RANGE',
              operator: 'between',
              value: `${start},${end}`
            }
          ]
        : [];
    }
    if (!filter.fieldId) return [];
    if (filter.input === 'date') {
      return [
        { fieldId: filter.fieldId, field: filter.fieldId, operator: 'eq', value: String(mappedValue) }
      ];
    }
    if (filter.input === 'multiselect') {
      const selected = (
        Array.isArray(mappedValue) ? mappedValue : mappedValue.split(',')
      )
        .map((value) => value.trim())
        .filter((value) => value && !isUniversalSelection(value));
      return selected.length
        ? [
            {
              fieldId: filter.fieldId,
              field: filter.fieldId,
              operator: 'in',
              value: selected.join(',')
            }
          ]
        : [];
    }
    if (Array.isArray(mappedValue)) {
      if (mappedValue.length === 2 && mappedValue.every(isIsoDate)) {
        return [
          {
            fieldId: filter.fieldId,
            field: filter.fieldId,
            operator: 'between',
            value: `${mappedValue[0]},${mappedValue[1]}`
          }
        ];
      }
      return mappedValue.length
        ? [
            {
              fieldId: filter.fieldId,
              field: filter.fieldId,
              operator: 'in',
              value: (mappedValue as string[]).join(',')
            }
          ]
        : [];
    }
    return [
      {
        fieldId: filter.fieldId,
        field: filter.fieldId,
        operator: filter.input === 'text' ? 'contains' : 'eq',
        value: mappedValue
      }
    ];
  });
}
export function activeDashboardFilters(
  filters: GlobalFilter[],
  values: Record<string, string>
): ActiveDashboardFilter[] {
  return filters.flatMap((filter) => {
    const value = (values[filter.id] ?? filter.defaultValue).trim();
    return filter.fieldId && value && !isUniversalSelection(value)
      ? [{ id: filter.id, fieldId: filter.fieldId, label: filter.label, value }]
      : [];
  });
}
export function resolveWidgetRuntimeFilters(
  filters: WidgetFilter[]
): RuntimeQueryFilter[] {
  return filters.flatMap((filter) => {
    if (!filter.fieldId) return [];
    const value = filter.value?.trim() ?? '';
    if (!value) return [];
    return [
      {
        fieldId: filter.fieldId,
        field: filter.fieldId,
        operator: filter.operator,
        value
      }
    ];
  });
}
export function mergeRuntimeFilters(
  globalFilters: RuntimeQueryFilter[],
  widgetFilters: RuntimeQueryFilter[]
): RuntimeQueryFilter[] {
  const overrideFields = new Set(widgetFilters.map((filter) => filter.fieldId));
  return [
    ...globalFilters.filter((filter) => !overrideFields.has(filter.fieldId)),
    ...widgetFilters
  ];
}
export function isUniversalSelection(value: string): boolean {
  return ['tous', 'toutes', 'all', '*'].includes(
    value.trim().toLocaleLowerCase('fr')
  );
}
function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
