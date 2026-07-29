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
    public List<java.util.Map<String, Object>> executeQueryData(UUID id, List<com.dynamicdashboard.cockpit.query.application.dto.RuntimeQueryFilterDto> filters) {
        Optional<DataQueryEntity> queryOpt = dataQueryRepository.findById(id);
        if (queryOpt.isEmpty()) return java.util.Collections.emptyList();

        DataQueryEntity query = queryOpt.get();
        List<QuerySourceBindingEntity> sources = querySourceBindingRepository.findByQueryIdOrderByPositionIndexAsc(query.getId());
        if (sources.isEmpty()) return java.util.Collections.emptyList();

        String tableName = sources.get(0).getDataSource().getTableName();
        if (tableName == null || tableName.isBlank()) return java.util.Collections.emptyList();

        List<QueryGroupByFieldEntity> groupByFields = queryGroupByFieldRepository.findByIdQueryIdOrderByPositionIndexAsc(query.getId());

        DynamicSqlBuilderPattern builder = DynamicSqlBuilderPattern.from(tableName).limit(query.getRowLimit());

        if (filters != null && !filters.isEmpty()) {
            for (com.dynamicdashboard.cockpit.query.application.dto.RuntimeQueryFilterDto filter : filters) {
                if ("GLOBAL_DATE_RANGE".equals(filter.getFieldId()) && "between".equals(filter.getOperator())) {
                    String[] dates = filter.getValue().split(",");
                    if (dates.length == 2) {
                        String start = dates[0].trim();
                        String end = dates[1].trim();


                        builder.where("created_at >= '" + start + " 00:00:00' AND created_at <= '" + end + " 23:59:59'");
                    }
                } else if (filter.getFieldId() != null) {
                    dataFieldRepository.findByFieldKey(filter.getFieldId()).ifPresent(field -> {
                        String col = field.getFieldKey();
                        if ("eq".equals(filter.getOperator())) {
                            builder.where(col + " = '" + filter.getValue().replace("'", "''") + "'");
                        } else if ("in".equals(filter.getOperator())) {
                            String[] vals = filter.getValue().split(",");
                            StringBuilder inClause = new StringBuilder(col + " IN (");
                            for (int i = 0; i < vals.length; i++) {
                                inClause.append("'").append(vals[i].trim().replace("'", "''")).append("'");
                                if (i < vals.length - 1) inClause.append(",");
                            }
                            inClause.append(")");
                            builder.where(inClause.toString());
                        }
                    });
                }
            }
        }

        if (query.getAggregation() != null && !AggregationType.NONE.equals(query.getAggregation())) {
            String groupByColumn = groupByFields.isEmpty()
                ? "'Tous'"
                : groupByFields.get(0).getField().getFieldKey();
            String aggColumn = query.getAggregationField() != null
                ? query.getAggregationField().getFieldKey()
                : "*";
            builder.groupBy(groupByColumn).aggregate(query.getAggregation().name(), aggColumn);
        } else {
            builder.selectAll();
        }

        try {
            return erpJdbcTemplate.queryForList(builder.build());
        } catch (Exception e) {
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
            dataFieldRepository.findByFieldKey(dto.getAggregationFieldId()).ifPresent(query::setAggregationField);
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
