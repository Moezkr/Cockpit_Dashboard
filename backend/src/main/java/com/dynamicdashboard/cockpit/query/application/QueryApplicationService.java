package com.dynamicdashboard.cockpit.query.application;

import com.dynamicdashboard.cockpit.catalog.domain.DataFieldEntity;
import com.dynamicdashboard.cockpit.catalog.repository.DataFieldRepository;
import com.dynamicdashboard.cockpit.catalog.repository.DataSourceRepository;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.query.application.dto.QueryConditionDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryJoinDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryRequestDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryResponseDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryTransformationDto;
import com.dynamicdashboard.cockpit.query.application.mapper.QueryMapper;
import com.dynamicdashboard.cockpit.query.domain.DataQueryEntity;
import com.dynamicdashboard.cockpit.query.domain.QueryConditionEntity;
import com.dynamicdashboard.cockpit.query.domain.QueryGroupByFieldEntity;
import com.dynamicdashboard.cockpit.query.domain.QueryGroupByFieldEntity.QueryGroupByFieldId;
import com.dynamicdashboard.cockpit.query.domain.QueryJoinEntity;
import com.dynamicdashboard.cockpit.query.domain.QuerySelectedFieldEntity;
import com.dynamicdashboard.cockpit.query.domain.QuerySelectedFieldEntity.QuerySelectedFieldId;
import com.dynamicdashboard.cockpit.query.domain.QuerySortEntity;
import com.dynamicdashboard.cockpit.query.domain.QuerySourceBindingEntity;
import com.dynamicdashboard.cockpit.query.domain.QueryTransformationEntity;
import com.dynamicdashboard.cockpit.query.repository.DataQueryRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryConditionRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryGroupByFieldRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryJoinRepository;
import com.dynamicdashboard.cockpit.query.repository.QuerySelectedFieldRepository;
import com.dynamicdashboard.cockpit.query.repository.QuerySortRepository;
import com.dynamicdashboard.cockpit.query.repository.QuerySourceBindingRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryTransformationRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.AggregationType;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.FilterOperator;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.LogicalOperator;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.QueryJoinType;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.QueryTransformationType;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.QueryVisibility;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.SortDirection;
import com.dynamicdashboard.cockpit.shared.security.CurrentUserService;
import com.dynamicdashboard.cockpit.shared.utils.ParsingUtils;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QueryApplicationService {

    @Qualifier("erpJdbcTemplate")
    private final JdbcTemplate erpJdbcTemplate;
    private final DataQueryRepository dataQueryRepository;
    private final QueryConditionRepository queryConditionRepository;
    private final QueryGroupByFieldRepository queryGroupByFieldRepository;
    private final QueryJoinRepository queryJoinRepository;
    private final QuerySelectedFieldRepository querySelectedFieldRepository;
    private final QuerySortRepository querySortRepository;
    private final QuerySourceBindingRepository querySourceBindingRepository;
    private final QueryTransformationRepository queryTransformationRepository;
    private final DataSourceRepository dataSourceRepository;
    private final DataFieldRepository dataFieldRepository;
    private final CurrentUserService currentUserService;
    private final QueryMapper queryMapper;
    private final com.dynamicdashboard.cockpit.audit.application.AuditApplicationService auditApplicationService;
    private final com.dynamicdashboard.cockpit.dashboard.repository.WidgetRepository widgetRepository;


    @Transactional(readOnly = true)
    public List<Map<String, Object>> executeQueryData(UUID queryId, List<com.dynamicdashboard.cockpit.query.application.dto.RuntimeQueryFilterDto> filters) {
        DataQueryEntity query = dataQueryRepository.findById(queryId).orElse(null);
        if (query == null) return java.util.Collections.emptyList();

        List<QuerySourceBindingEntity> sources = querySourceBindingRepository.findByQueryIdOrderByPositionIndexAsc(query.getId());
        if (sources.isEmpty()) return java.util.Collections.emptyList();

        String primaryTable = sources.get(0).getDataSource().getSourceKey();
        if (primaryTable == null || primaryTable.isBlank()) return java.util.Collections.emptyList();

        org.jooq.DSLContext dsl = org.jooq.impl.DSL.using(org.jooq.SQLDialect.POSTGRES);
        List<QueryGroupByFieldEntity> groupByFields = queryGroupByFieldRepository.findByIdQueryIdOrderByPositionIndexAsc(query.getId());
        
        org.jooq.SelectJoinStep<?> jooqQuery;
        
        if (query.getAggregation() != null && !AggregationType.NONE.equals(query.getAggregation())) {
            org.jooq.Field<?> groupByColumn = groupByFields.isEmpty()
                ? org.jooq.impl.DSL.val("Tous").as("label")
                : org.jooq.impl.DSL.field(groupByFields.get(0).getField().getDataSource() != null
                    ? groupByFields.get(0).getField().getDataSource().getSourceKey() + "." + groupByFields.get(0).getField().getFieldKey()
                    : groupByFields.get(0).getField().getFieldKey()).as("label");
                    
            String aggColumnName = query.getAggregationField() != null
                ? (query.getAggregationField().getDataSource() != null
                    ? query.getAggregationField().getDataSource().getSourceKey() + "." + query.getAggregationField().getFieldKey()
                    : query.getAggregationField().getFieldKey())
                : "*";
                
            DataFieldEntity aggFieldEntity = query.getAggregationField();
            boolean isNumericField = aggFieldEntity != null && 
                (com.dynamicdashboard.cockpit.shared.domain.DomainEnums.FieldType.AMOUNT.equals(aggFieldEntity.getFieldType()) || 
                 com.dynamicdashboard.cockpit.shared.domain.DomainEnums.FieldType.NUMBER.equals(aggFieldEntity.getFieldType()) ||
                 com.dynamicdashboard.cockpit.shared.domain.DomainEnums.FieldType.PERCENT.equals(aggFieldEntity.getFieldType()));
                
            org.jooq.Field<?> aggColumn;
            if (AggregationType.SUM.equals(query.getAggregation())) {
                if (isNumericField) {
                    aggColumn = org.jooq.impl.DSL.sum(org.jooq.impl.DSL.field(aggColumnName, java.math.BigDecimal.class)).as("value");
                } else {
                    aggColumn = org.jooq.impl.DSL.count(org.jooq.impl.DSL.field(aggColumnName)).as("value");
                }
            } else if (AggregationType.AVG.equals(query.getAggregation())) {
                if (isNumericField) {
                    aggColumn = org.jooq.impl.DSL.avg(org.jooq.impl.DSL.field(aggColumnName, java.math.BigDecimal.class)).as("value");
                } else {
                    aggColumn = org.jooq.impl.DSL.count(org.jooq.impl.DSL.field(aggColumnName)).as("value");
                }
            } else if (AggregationType.COUNT.equals(query.getAggregation())) {
                aggColumn = org.jooq.impl.DSL.count(org.jooq.impl.DSL.field(aggColumnName)).as("value");
            } else if (AggregationType.MAX.equals(query.getAggregation())) {
                aggColumn = org.jooq.impl.DSL.max(org.jooq.impl.DSL.field(aggColumnName)).as("value");
            } else if (AggregationType.MIN.equals(query.getAggregation())) {
                aggColumn = org.jooq.impl.DSL.min(org.jooq.impl.DSL.field(aggColumnName)).as("value");
            } else {
                aggColumn = org.jooq.impl.DSL.field(aggColumnName).as("value");
            }
            
            jooqQuery = dsl.select(groupByColumn, aggColumn).from(org.jooq.impl.DSL.table(primaryTable));
        } else {
            jooqQuery = dsl.select(org.jooq.impl.DSL.asterisk()).from(org.jooq.impl.DSL.table(primaryTable));
        }

        java.util.Set<String> includedTables = new java.util.HashSet<>();
        includedTables.add(primaryTable.toLowerCase());

        List<QueryJoinEntity> joins = queryJoinRepository.findByQueryId(query.getId());
        for (QueryJoinEntity join : joins) {
            if (join.getLeftField() != null && join.getRightField() != null) {
                String leftTable = join.getLeftField().getDataSource() != null
                    ? join.getLeftField().getDataSource().getSourceKey()
                    : (join.getLeftSource() != null ? join.getLeftSource().getSourceKey() : primaryTable);
                String rightTable = join.getRightField().getDataSource() != null
                    ? join.getRightField().getDataSource().getSourceKey()
                    : (join.getRightSource() != null ? join.getRightSource().getSourceKey() : "");
                
                String leftField = join.getLeftField().getFieldKey();
                String rightField = join.getRightField().getFieldKey();

                if (!leftTable.isBlank() && !rightTable.isBlank() && !leftTable.equalsIgnoreCase(rightTable)) {
                    String newTable = null;
                    if (includedTables.contains(leftTable.toLowerCase()) && !includedTables.contains(rightTable.toLowerCase())) {
                        newTable = rightTable;
                    } else if (includedTables.contains(rightTable.toLowerCase()) && !includedTables.contains(leftTable.toLowerCase())) {
                        newTable = leftTable;
                    } else if (!includedTables.contains(leftTable.toLowerCase()) && !includedTables.contains(rightTable.toLowerCase())) {
                        newTable = rightTable;
                    }
                    
                    if (newTable != null) {
                        org.jooq.Table<?> jooqNewTable = org.jooq.impl.DSL.table(newTable);
                        org.jooq.Condition onCondition = org.jooq.impl.DSL.field(leftTable + "." + leftField).eq(org.jooq.impl.DSL.field(rightTable + "." + rightField));
                        
                        if (QueryJoinType.INNER.equals(join.getJoinType())) {
                            jooqQuery = jooqQuery.join(jooqNewTable).on(onCondition);
                        } else if (QueryJoinType.RIGHT.equals(join.getJoinType())) {
                            jooqQuery = jooqQuery.rightJoin(jooqNewTable).on(onCondition);
                        } else {
                            jooqQuery = jooqQuery.leftJoin(jooqNewTable).on(onCondition);
                        }
                        includedTables.add(newTable.toLowerCase());
                    }
                }
            }
        }

        org.jooq.Condition finalCondition = org.jooq.impl.DSL.noCondition();
        List<QueryConditionEntity> conditions = queryConditionRepository.findByQueryId(query.getId());
        for (QueryConditionEntity condition : conditions) {
            if (condition.getField() != null && condition.getValueExpression() != null) {
                String col = condition.getField().getDataSource() != null
                    ? condition.getField().getDataSource().getSourceKey() + "." + condition.getField().getFieldKey()
                    : condition.getField().getFieldKey();
                
                if (FilterOperator.EQ.equals(condition.getOperator())) {
                    finalCondition = finalCondition.and(org.jooq.impl.DSL.field(col).eq(condition.getValueExpression()));
                }
            }
        }

        if (filters != null && !filters.isEmpty()) {
            for (com.dynamicdashboard.cockpit.query.application.dto.RuntimeQueryFilterDto filter : filters) {
                if ("GLOBAL_DATE_RANGE".equals(filter.getFieldId()) && "between".equals(filter.getOperator())) {
                    String[] dates = filter.getValue().split(",");
                    if (dates.length == 2) {
                        finalCondition = finalCondition.and(org.jooq.impl.DSL.field(primaryTable + ".created_at").between(dates[0].trim() + " 00:00:00", dates[1].trim() + " 23:59:59"));
                    }
                } else if (filter.getFieldId() != null) {
                    DataFieldEntity field = dataFieldRepository.findByFieldKey(filter.getFieldId()).orElse(null);
                    if (field != null) {
                        String col = field.getDataSource() != null
                            ? field.getDataSource().getSourceKey() + "." + field.getFieldKey()
                            : field.getFieldKey();
                        if ("eq".equals(filter.getOperator())) {
                            finalCondition = finalCondition.and(org.jooq.impl.DSL.field(col).eq(filter.getValue())); 
                        } else if ("in".equals(filter.getOperator())) {
                            String[] vals = filter.getValue().split(",");
                            List<String> trimmedVals = new java.util.ArrayList<>();
                            for (String v : vals) trimmedVals.add(v.trim());
                            finalCondition = finalCondition.and(org.jooq.impl.DSL.field(col).in(trimmedVals));
                        }
                    }
                }
            }
        }

        org.jooq.SelectConditionStep<?> whereQuery = jooqQuery.where(finalCondition);
        org.jooq.SelectLimitStep<?> step1 = whereQuery;
        
        if (query.getAggregation() != null && !AggregationType.NONE.equals(query.getAggregation())) {
            if (!groupByFields.isEmpty()) {
                org.jooq.Field<?> groupByColumn = org.jooq.impl.DSL.field(groupByFields.get(0).getField().getDataSource() != null
                    ? groupByFields.get(0).getField().getDataSource().getSourceKey() + "." + groupByFields.get(0).getField().getFieldKey()
                    : groupByFields.get(0).getField().getFieldKey());
                        
                step1 = whereQuery.groupBy(groupByColumn);
            }
        }

        org.jooq.Select<?> finalQuery = step1;
        Integer limit = query.getRowLimit();
        if (limit != null && limit > 0) {
            finalQuery = step1.limit(limit);
        }

        try {
            String sql = finalQuery.getSQL(org.jooq.conf.ParamType.INLINED);
            return erpJdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(QueryApplicationService.class).warn("Query execution error for queryId {}: {}", queryId, e.getMessage());
            return java.util.Collections.emptyList();
        }
    }


    @Transactional(readOnly = true)
    public List<QueryResponseDto> getAllQueries() {
        return dataQueryRepository.findAll().stream()
                .map(queryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<QueryResponseDto> getQueryById(UUID id) {
        return dataQueryRepository.findById(id).map(queryMapper::toDto);
    }

    @Transactional
    public QueryResponseDto createQuery(QueryRequestDto dto) {
        UserAccountEntity owner = currentUserService.getCurrentUser();

        DataQueryEntity query = new DataQueryEntity();
        query.setOwner(owner);
        applyDtoToQueryEntity(dto, query);
        DataQueryEntity savedQuery = dataQueryRepository.save(query);

        saveChildEntities(savedQuery, dto);

        auditApplicationService.logEvent("Création de requête", "QUERY", savedQuery.getId(), savedQuery.getQueryName(), null);

        return queryMapper.toDto(savedQuery);
    }

    @Transactional
    public Optional<QueryResponseDto> updateQuery(UUID id, QueryRequestDto dto) {
        return dataQueryRepository.findById(id).map(query -> {
            applyDtoToQueryEntity(dto, query);
            query.setUpdatedAt(java.time.Instant.now());
            DataQueryEntity updatedQuery = dataQueryRepository.save(query);

            deleteChildEntities(updatedQuery.getId());
            saveChildEntities(updatedQuery, dto);

            auditApplicationService.logEvent("Modification de requête", "QUERY", updatedQuery.getId(), updatedQuery.getQueryName(), null);

            return queryMapper.toDto(updatedQuery);
        });
    }

    @Transactional
    public boolean deleteQuery(UUID id) {
        return dataQueryRepository.findById(id).map(query -> {
            List<com.dynamicdashboard.cockpit.dashboard.domain.WidgetEntity> widgets = widgetRepository.findByQueryId(id);
            for (com.dynamicdashboard.cockpit.dashboard.domain.WidgetEntity w : widgets) {
                w.setQuery(null);
                widgetRepository.save(w);
            }
            deleteChildEntities(query.getId());
            auditApplicationService.logEvent("Suppression de requête", "QUERY", query.getId(), query.getQueryName(), null);
            dataQueryRepository.delete(query);
            return true;
        }).orElse(false);
    }

    @Transactional
    public Optional<QueryResponseDto> duplicateQuery(UUID id) {
        return dataQueryRepository.findById(id).map(source -> {
            QueryResponseDto sourceDto = queryMapper.toDto(source);
            QueryRequestDto copyDto = QueryRequestDto.builder()
                    .name(sourceDto.getName() + " (copie)")
                    .description(sourceDto.getDescription())
                    .visibility(sourceDto.getVisibility())
                    .sourceIds(sourceDto.getSourceIds() != null ? new ArrayList<>(sourceDto.getSourceIds()) : new ArrayList<>())
                    .joins(sourceDto.getJoins() != null ? new ArrayList<>(sourceDto.getJoins()) : new ArrayList<>())
                    .selectedFieldIds(sourceDto.getSelectedFieldIds() != null ? new ArrayList<>(sourceDto.getSelectedFieldIds()) : new ArrayList<>())
                    .conditions(sourceDto.getConditions() != null ? new ArrayList<>(sourceDto.getConditions()) : new ArrayList<>())
                    .transformations(sourceDto.getTransformations() != null ? new ArrayList<>(sourceDto.getTransformations()) : new ArrayList<>())
                    .groupByFieldIds(sourceDto.getGroupByFieldIds() != null ? new ArrayList<>(sourceDto.getGroupByFieldIds()) : new ArrayList<>())
                    .aggregation(sourceDto.getAggregation())
                    .aggregationFieldId(sourceDto.getAggregationFieldId())
                    .sort(sourceDto.getSort())
                    .rowLimit(sourceDto.getRowLimit())
                    .build();

            if (copyDto.getJoins() != null) {
                copyDto.getJoins().forEach(j -> j.setId(null));
            }
            if (copyDto.getConditions() != null) {
                copyDto.getConditions().forEach(c -> c.setId(null));
            }
            if (copyDto.getTransformations() != null) {
                copyDto.getTransformations().forEach(t -> t.setId(null));
            }

            QueryResponseDto created = createQuery(copyDto);
            auditApplicationService.logEvent("Duplication de requête", "QUERY", created.getId(), created.getName(), null);
            return created;
        });
    }

    private void applyDtoToQueryEntity(QueryRequestDto dto, DataQueryEntity query) {
        query.setQueryName(dto.getName() != null ? dto.getName() : "Nouvelle requête");
        query.setQueryDescription(dto.getDescription());
        query.setVisibility(ParsingUtils.parseEnum(QueryVisibility.class, dto.getVisibility(), QueryVisibility.SHARED));
        query.setAggregation(ParsingUtils.parseEnum(AggregationType.class, dto.getAggregation(), AggregationType.NONE));
        if (dto.getAggregationFieldId() != null && !dto.getAggregationFieldId().isBlank()) {
            resolveField(dto.getAggregationFieldId()).ifPresent(query::setAggregationField);
        } else {
            query.setAggregationField(null);
        }
        query.setRowLimit(dto.getRowLimit() > 0 ? dto.getRowLimit() : 100);
    }

    private void saveChildEntities(DataQueryEntity query, QueryRequestDto dto) {
        if (dto.getSourceIds() != null) {
            List<String> distinctSources = dto.getSourceIds().stream().distinct().toList();
            for (int i = 0; i < distinctSources.size(); i++) {
                String sourceIdStr = distinctSources.get(i);
                final int idx = i;
                resolveDataSource(sourceIdStr).ifPresent(ds -> {
                    QuerySourceBindingEntity sb = new QuerySourceBindingEntity();
                    sb.setQuery(query);
                    sb.setDataSource(ds);
                    sb.setPositionIndex(idx);
                    querySourceBindingRepository.save(sb);
                });
            }
        }

        if (dto.getSelectedFieldIds() != null) {
            for (int i = 0; i < dto.getSelectedFieldIds().size(); i++) {
                String fieldIdStr = dto.getSelectedFieldIds().get(i);
                final int idx = i;
                resolveField(fieldIdStr).ifPresent(df -> {
                    QuerySelectedFieldEntity sf = new QuerySelectedFieldEntity();
                    QuerySelectedFieldId sfId = new QuerySelectedFieldId();
                    sfId.setQueryId(query.getId());
                    sfId.setFieldId(df.getId());
                    sf.setId(sfId);
                    sf.setQuery(query);
                    sf.setField(df);
                    sf.setPositionIndex(idx);
                    querySelectedFieldRepository.save(sf);
                });
            }
        }

        if (dto.getGroupByFieldIds() != null) {
            for (int i = 0; i < dto.getGroupByFieldIds().size(); i++) {
                String fieldIdStr = dto.getGroupByFieldIds().get(i);
                final int idx = i;
                resolveField(fieldIdStr).ifPresent(df -> {
                    QueryGroupByFieldEntity gb = new QueryGroupByFieldEntity();
                    QueryGroupByFieldId gbId = new QueryGroupByFieldId();
                    gbId.setQueryId(query.getId());
                    gbId.setFieldId(df.getId());
                    gb.setId(gbId);
                    gb.setQuery(query);
                    gb.setField(df);
                    gb.setPositionIndex(idx);
                    queryGroupByFieldRepository.save(gb);
                });
            }
        }

        if (dto.getJoins() != null) {
            for (QueryJoinDto joinDto : dto.getJoins()) {
                QueryJoinEntity join = new QueryJoinEntity();
                join.setQuery(query);
                if (joinDto.getLeftSourceId() != null) resolveDataSource(joinDto.getLeftSourceId()).ifPresent(join::setLeftSource);
                if (joinDto.getLeftFieldId() != null) resolveField(joinDto.getLeftFieldId()).ifPresent(join::setLeftField);
                join.setJoinType(ParsingUtils.parseEnum(QueryJoinType.class, joinDto.getType(), QueryJoinType.INNER));
                if (joinDto.getRightSourceId() != null) resolveDataSource(joinDto.getRightSourceId()).ifPresent(join::setRightSource);
                if (joinDto.getRightFieldId() != null) resolveField(joinDto.getRightFieldId()).ifPresent(join::setRightField);
                queryJoinRepository.save(join);
            }
        }

        if (dto.getConditions() != null) {
            for (QueryConditionDto condDto : dto.getConditions()) {
                if (condDto.getFieldId() != null) {
                    resolveField(condDto.getFieldId()).ifPresent(field -> {
                        QueryConditionEntity cond = new QueryConditionEntity();
                        cond.setQuery(query);
                        cond.setField(field);
                        cond.setOperator(ParsingUtils.parseEnum(FilterOperator.class, condDto.getOperator(), FilterOperator.EQ));
                        cond.setValueExpression(condDto.getValue() != null ? condDto.getValue() : "");
                        cond.setLogicalOperator(ParsingUtils.parseEnum(LogicalOperator.class, condDto.getLogical(), LogicalOperator.AND));
                        cond.setParameterizable(condDto.isParametrable());
                        queryConditionRepository.save(cond);
                    });
                }
            }
        }

        if (dto.getTransformations() != null) {
            for (QueryTransformationDto trDto : dto.getTransformations()) {
                QueryTransformationEntity tr = new QueryTransformationEntity();
                tr.setQuery(query);
                tr.setTransformationType(ParsingUtils.parseEnum(QueryTransformationType.class, trDto.getType(), QueryTransformationType.RENAME));
                if (trDto.getFieldId() != null) resolveField(trDto.getFieldId()).ifPresent(tr::setTargetField);
                tr.setOutputLabel(trDto.getOutputLabel());
                tr.setFormulaExpression(trDto.getFormula());
                tr.setFormatOption(trDto.getFormat());
                tr.setReplacementValue(trDto.getReplacementValue());
                if (trDto.getOperator() != null) {
                    tr.setOperator(ParsingUtils.parseEnum(FilterOperator.class, trDto.getOperator(), null));
                }
                tr.setComparisonValue(trDto.getValue());
                queryTransformationRepository.save(tr);
            }
        }

        if (dto.getSort() != null && dto.getSort().getFieldId() != null) {
            resolveField(dto.getSort().getFieldId()).ifPresent(field -> {
                QuerySortEntity sort = querySortRepository.findById(query.getId()).orElseGet(() -> {
                    QuerySortEntity s = new QuerySortEntity();
                    s.setQuery(query);
                    return s;
                });
                sort.setField(field);
                sort.setDirection(ParsingUtils.parseEnum(SortDirection.class, dto.getSort().getDirection(), SortDirection.ASC));
                querySortRepository.save(sort);
            });
        }
    }

    private Optional<DataFieldEntity> resolveField(String fieldIdStr) {
        if (fieldIdStr == null || fieldIdStr.isBlank()) return Optional.empty();
        UUID uuid = ParsingUtils.parseUuid(fieldIdStr);
        if (uuid != null) {
            Optional<DataFieldEntity> byId = dataFieldRepository.findById(uuid);
            if (byId.isPresent()) return byId;
        }
        return dataFieldRepository.findFirstByFieldKey(fieldIdStr);
    }

    private Optional<com.dynamicdashboard.cockpit.catalog.domain.DataSourceEntity> resolveDataSource(String sourceIdStr) {
        if (sourceIdStr == null || sourceIdStr.isBlank()) return Optional.empty();
        UUID uuid = ParsingUtils.parseUuid(sourceIdStr);
        if (uuid != null) {
            Optional<com.dynamicdashboard.cockpit.catalog.domain.DataSourceEntity> byId = dataSourceRepository.findById(uuid);
            if (byId.isPresent()) return byId;
        }
        return dataSourceRepository.findBySourceKey(sourceIdStr);
    }

    private void deleteChildEntities(UUID queryId) {
        querySourceBindingRepository.deleteAll(querySourceBindingRepository.findByQueryIdOrderByPositionIndexAsc(queryId));
        querySourceBindingRepository.flush();
        querySelectedFieldRepository.deleteAll(querySelectedFieldRepository.findByIdQueryIdOrderByPositionIndexAsc(queryId));
        querySelectedFieldRepository.flush();
        queryGroupByFieldRepository.deleteAll(queryGroupByFieldRepository.findByIdQueryIdOrderByPositionIndexAsc(queryId));
        queryGroupByFieldRepository.flush();
        queryJoinRepository.deleteAll(queryJoinRepository.findByQueryId(queryId));
        queryJoinRepository.flush();
        queryConditionRepository.deleteAll(queryConditionRepository.findByQueryId(queryId));
        queryConditionRepository.flush();
        queryTransformationRepository.deleteAll(queryTransformationRepository.findByQueryId(queryId));
        queryTransformationRepository.flush();
        querySortRepository.findById(queryId).ifPresent(s -> {
            querySortRepository.delete(s);
            querySortRepository.flush();
        });
    }
}
