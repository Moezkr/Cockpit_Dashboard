import { QueryResponseDto, QueryRequestDto, QueryJoinDto, QueryConditionDto, QueryTransformationDto, QuerySortDto } from '../dtos/query.dto';
import { DataQuery, QueryJoin, QueryCondition, QueryTransformation, QuerySort } from '@core/models/types';

export class QueryMapper {
  static toDomain(dto: QueryResponseDto): DataQuery {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description || '',
      visibility: 'personal',
      sourceIds: dto.sourceIds,
      joins: dto.joins.map(j => this.toJoinDomain(j)),
      selectedFieldIds: dto.selectedFieldIds,
      conditions: dto.conditions.map(c => this.toConditionDomain(c)),
      groupByFieldIds: dto.groupByFieldIds,
      aggregation: 'none',
      sort: dto.sorts && dto.sorts.length > 0 ? this.toSortDomain(dto.sorts[0]) : undefined,
      transformations: dto.transformations.map(t => this.toTransformationDomain(t)),
      rowLimit: dto.rowLimit || 100,
      usedByWidgets: dto.usedByWidgets || 0,
      updatedAt: dto.updatedAt || new Date().toISOString()
    };
  }

  static toDto(domain: DataQuery): QueryRequestDto {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      sourceIds: domain.sourceIds,
      joins: domain.joins.map(j => this.toJoinDto(j)),
      selectedFieldIds: domain.selectedFieldIds,
      conditions: domain.conditions.map(c => this.toConditionDto(c)),
      groupByFieldIds: domain.groupByFieldIds,
      sorts: domain.sort ? [this.toSortDto(domain.sort)] : [],
      transformations: domain.transformations.map(t => this.toTransformationDto(t)),
      rowLimit: domain.rowLimit,
      tags: [],
      usedByWidgets: domain.usedByWidgets,
      createdAt: domain.updatedAt,
      updatedAt: domain.updatedAt
    };
  }

  private static toJoinDomain(dto: QueryJoinDto): QueryJoin {
    return { id: dto.id, type: dto.type as any, leftSourceId: dto.leftSourceId, leftFieldId: dto.leftFieldId, rightSourceId: dto.rightSourceId, rightFieldId: dto.rightFieldId };
  }
  private static toJoinDto(domain: QueryJoin): QueryJoinDto {
    return { id: domain.id, type: domain.type, leftSourceId: domain.leftSourceId, leftFieldId: domain.leftFieldId, rightSourceId: domain.rightSourceId, rightFieldId: domain.rightFieldId };
  }

  private static toConditionDomain(dto: QueryConditionDto): QueryCondition {
    return { id: dto.id, fieldId: dto.fieldId, operator: dto.operator as any, value: dto.value, logical: (dto.logicalOperator as any) || 'AND', parametrable: false };
  }
  private static toConditionDto(domain: QueryCondition): QueryConditionDto {
    return { id: domain.id, fieldId: domain.fieldId, operator: domain.operator, value: domain.value, logicalOperator: domain.logical };
  }

  private static toSortDomain(dto: QuerySortDto): QuerySort {
    return { fieldId: dto.fieldId, direction: dto.direction as any };
  }
  private static toSortDto(domain: QuerySort): QuerySortDto {
    return { fieldId: domain.fieldId, direction: domain.direction };
  }

  private static toTransformationDomain(dto: QueryTransformationDto): QueryTransformation {
    return { id: dto.id, type: dto.type as any, ...dto.config };
  }
  private static toTransformationDto(domain: QueryTransformation): QueryTransformationDto {
    const { id, type, ...config } = domain;
    return { id, type, config };
  }
}
