import {
  DataField,
  DataQuery,
  DataSource,
  QueryTransformation
} from '@core/models/types';
export function querySourceIds(
  query: Pick<DataQuery, 'sourceIds' | 'sourceId'>
): string[] {
  const ids = query.sourceIds?.filter(Boolean) ?? [];
  return ids.length > 0
    ? [...new Set(ids)]
    : query.sourceId
    ? [query.sourceId]
    : [];
}
export function normalizeQuery(query: DataQuery): DataQuery {
  const sourceIds = querySourceIds(query);
  return {
    ...query,
    sourceIds,
    joins: query.joins ?? [],
    transformations: query.transformations ?? []
  };
}
export function normalizeQueries(queries: DataQuery[]): DataQuery[] {
  return queries.map(normalizeQuery);
}
export interface CatalogField extends DataField {
  sourceId: string;
  sourceLabel: string;
}
export function queryFieldCatalog(
  query: DataQuery,
  sources: DataSource[]
): CatalogField[] {
  const sourceIds = querySourceIds(query);
  if (query.joins?.length) {
    query.joins.forEach((j) => {
      if (j.leftSourceId && !sourceIds.includes(j.leftSourceId)) sourceIds.push(j.leftSourceId);
      if (j.rightSourceId && !sourceIds.includes(j.rightSourceId)) sourceIds.push(j.rightSourceId);
    });
  }
  return sources
    .filter((source: any) => sourceIds.includes(source.id) || (source.key && sourceIds.includes(source.key)))
    .flatMap((source) =>
      source.fields.map((field) => ({
        ...field,
        sourceId: source.id,
        sourceLabel: source.label
      }))
    );
}
export function fieldLabel(
  fieldId: string,
  query: DataQuery,
  sources: DataSource[]
): string {
  const field = queryFieldCatalog(query, sources).find(
    (item) => item.id === fieldId
  );
  const calculated = query.transformations.find(
    (item) => item.type === 'calculated' && item.outputLabel === fieldId
  );
  if (calculated) return calculated.outputLabel ?? fieldId;
  return field ? `${field.sourceLabel} · ${field.label}` : fieldId;
}
export function transformationReferencesField(
  transformation: QueryTransformation,
  fieldId: string
): boolean {
  return (
    transformation.fieldId === fieldId ||
    transformation.formula?.includes(fieldId) === true
  );
}
export function querySourceSummary(query: DataQuery): string {
  const sources = querySourceIds(query).length;
  const transforms = query.transformations?.length ?? 0;
  return `${sources} source${sources > 1 ? 's' : ''}${
    transforms
      ? ` · ${transforms} transformation${transforms > 1 ? 's' : ''}`
      : ''
  }`;
}
