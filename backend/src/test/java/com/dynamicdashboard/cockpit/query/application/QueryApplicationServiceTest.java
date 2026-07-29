package com.dynamicdashboard.cockpit.query.application;
import com.dynamicdashboard.cockpit.catalog.domain.DataFieldEntity;
import com.dynamicdashboard.cockpit.catalog.domain.DataSourceEntity;
import com.dynamicdashboard.cockpit.catalog.repository.DataFieldRepository;
import com.dynamicdashboard.cockpit.catalog.repository.DataSourceRepository;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.repository.UserAccountRepository;
import com.dynamicdashboard.cockpit.query.application.dto.QueryConditionDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryJoinDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryRequestDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryResponseDto;
import com.dynamicdashboard.cockpit.query.application.dto.QuerySortDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryTransformationDto;
import com.dynamicdashboard.cockpit.query.domain.DataQueryEntity;
import com.dynamicdashboard.cockpit.query.repository.DataQueryRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryConditionRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryGroupByFieldRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryJoinRepository;
import com.dynamicdashboard.cockpit.query.repository.QuerySelectedFieldRepository;
import com.dynamicdashboard.cockpit.query.repository.QuerySortRepository;
import com.dynamicdashboard.cockpit.query.repository.QuerySourceBindingRepository;
import com.dynamicdashboard.cockpit.query.repository.QueryTransformationRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.AggregationType;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.QueryVisibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.dynamicdashboard.cockpit.query.application.mapper.QueryMapper;
import com.dynamicdashboard.cockpit.shared.security.CurrentUserService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QueryApplicationServiceTest {
    @Mock private DataQueryRepository dataQueryRepository;
    @Mock private QueryConditionRepository queryConditionRepository;
    @Mock private QueryGroupByFieldRepository queryGroupByFieldRepository;
    @Mock private QueryJoinRepository queryJoinRepository;
    @Mock private QuerySelectedFieldRepository querySelectedFieldRepository;
    @Mock private QuerySortRepository querySortRepository;
    @Mock private QuerySourceBindingRepository querySourceBindingRepository;
    @Mock private QueryTransformationRepository queryTransformationRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private DataSourceRepository dataSourceRepository;
    @Mock private DataFieldRepository dataFieldRepository;
    @Mock private com.dynamicdashboard.cockpit.audit.application.AuditApplicationService auditApplicationService;
    @Mock private com.dynamicdashboard.cockpit.dashboard.repository.WidgetRepository widgetRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private QueryMapper queryMapper;
    @InjectMocks
    private QueryApplicationService queryApplicationService;
    private DataQueryEntity mockQuery;
    private UserAccountEntity mockUser;
    private UUID queryId;
    private UUID sourceId;
    private UUID fieldId;
    @BeforeEach
    void setUp() {
        queryId = UUID.randomUUID();
        sourceId = UUID.randomUUID();
        fieldId = UUID.randomUUID();
        mockUser = new UserAccountEntity();
        mockUser.setId(UUID.randomUUID());
        mockUser.setDisplayName("Admin System");
        mockQuery = new DataQueryEntity();
        mockQuery.setId(queryId);
        mockQuery.setQueryName("Chiffre d'affaires par Client");
        mockQuery.setQueryDescription("Agrégation des factures validées");
        mockQuery.setVisibility(QueryVisibility.SHARED);
        mockQuery.setAggregation(AggregationType.SUM);
        mockQuery.setRowLimit(100);
        mockQuery.setOwner(mockUser);

        when(currentUserService.getCurrentUser()).thenReturn(mockUser);
        when(queryMapper.toDto(any())).thenAnswer(invocation -> {
            DataQueryEntity query = invocation.getArgument(0);
            return QueryResponseDto.builder()
                    .id(query.getId())
                    .name(query.getQueryName())
                    .description(query.getQueryDescription())
                    .visibility(query.getVisibility() != null ? query.getVisibility().name().toLowerCase() : "shared")
                    .rowLimit(query.getRowLimit())
                    .build();
        });
    }
    @Test
    @DisplayName("PASS: Retrieve all queries successfully")
    void testGetAllQueries_Success() {
        when(dataQueryRepository.findAll()).thenReturn(List.of(mockQuery));
        List<QueryResponseDto> queries = queryApplicationService.getAllQueries();
        assertNotNull(queries);
        assertEquals(1, queries.size());
        assertEquals("Chiffre d'affaires par Client", queries.get(0).getName());
        assertEquals("shared", queries.get(0).getVisibility());
    }
    @Test
    @DisplayName("PASS: Get query by valid ID returns mapped DTO")
    void testGetQueryById_Found() {
        when(dataQueryRepository.findById(queryId)).thenReturn(Optional.of(mockQuery));
        Optional<QueryResponseDto> result = queryApplicationService.getQueryById(queryId);
        assertTrue(result.isPresent());
        assertEquals("Chiffre d'affaires par Client", result.get().getName());
        assertEquals(100, result.get().getRowLimit());
    }
    @Test
    @DisplayName("FAIL/EDGE: Get query by non-existing ID returns Optional.empty()")
    void testGetQueryById_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dataQueryRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<QueryResponseDto> result = queryApplicationService.getQueryById(invalidId);
        assertFalse(result.isPresent());
    }
    @Test
    @DisplayName("PASS: Create query with sources, joins, conditions, transformations, and sort")
    void testCreateQuery_Success() {
        DataSourceEntity ds = new DataSourceEntity();
        ds.setId(sourceId);
        ds.setSourceKey(sourceId.toString());
        DataFieldEntity df = new DataFieldEntity();
        df.setId(fieldId);
        df.setFieldKey(fieldId.toString());
        QueryRequestDto request = QueryRequestDto.builder()
                .name("Nouvelle Requête Test")
                .description("Desc Test")
                .visibility("shared")
                .sourceIds(List.of(sourceId.toString()))
                .selectedFieldIds(List.of(fieldId.toString()))
                .groupByFieldIds(List.of(fieldId.toString()))
                .aggregation("sum")
                .aggregationFieldId(fieldId.toString())
                .rowLimit(50)
                .joins(List.of(QueryJoinDto.builder().leftSourceId(sourceId.toString()).leftFieldId(fieldId.toString()).rightSourceId(sourceId.toString()).rightFieldId(fieldId.toString()).type("inner").build()))
                .conditions(List.of(QueryConditionDto.builder().fieldId(fieldId.toString()).operator("eq").value("100").logical("AND").parametrable(true).build()))
                .transformations(List.of(QueryTransformationDto.builder().type("rename").fieldId(fieldId.toString()).outputLabel("Montant Total").build()))
                .sort(QuerySortDto.builder().fieldId(fieldId.toString()).direction("desc").build())
                .build();
        when(userAccountRepository.findByUsername("ahaddad")).thenReturn(Optional.of(mockUser));
        when(dataFieldRepository.findByFieldKey(fieldId.toString())).thenReturn(Optional.of(df));
        when(dataFieldRepository.findById(fieldId)).thenReturn(Optional.of(df));
        when(dataSourceRepository.findBySourceKey(sourceId.toString())).thenReturn(Optional.of(ds));
        when(dataSourceRepository.findById(sourceId)).thenReturn(Optional.of(ds));
        when(dataQueryRepository.save(any(DataQueryEntity.class))).thenAnswer(i -> {
            DataQueryEntity q = i.getArgument(0);
            q.setId(queryId);
            return q;
        });
        QueryResponseDto response = queryApplicationService.createQuery(request);
        assertNotNull(response);
        assertEquals("Nouvelle Requête Test", response.getName());
        verify(dataQueryRepository, times(1)).save(any());
        verify(querySourceBindingRepository, times(1)).save(any());
        verify(querySelectedFieldRepository, times(1)).save(any());
        verify(queryGroupByFieldRepository, times(1)).save(any());
        verify(queryJoinRepository, times(1)).save(any());
        verify(queryConditionRepository, times(1)).save(any());
        verify(queryTransformationRepository, times(1)).save(any());
        verify(querySortRepository, times(1)).save(any());
    }
    @Test
    @DisplayName("PASS: Update existing query details")
    void testUpdateQuery_Found_Success() {
        QueryRequestDto updateRequest = QueryRequestDto.builder()
                .name("Requête Modifiée")
                .visibility("personal")
                .rowLimit(200)
                .build();
        when(dataQueryRepository.findById(queryId)).thenReturn(Optional.of(mockQuery));
        when(dataQueryRepository.save(any(DataQueryEntity.class))).thenAnswer(i -> i.getArgument(0));
        Optional<QueryResponseDto> result = queryApplicationService.updateQuery(queryId, updateRequest);
        assertTrue(result.isPresent());
        assertEquals("Requête Modifiée", result.get().getName());
        verify(querySourceBindingRepository, times(1)).deleteAll(anyList());
        verify(querySelectedFieldRepository, times(1)).deleteAll(anyList());
        verify(queryJoinRepository, times(1)).deleteAll(anyList());
        verify(queryConditionRepository, times(1)).deleteAll(anyList());
    }
    @Test
    @DisplayName("FAIL/EDGE: Update non-existing query returns Optional.empty()")
    void testUpdateQuery_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dataQueryRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<QueryResponseDto> result = queryApplicationService.updateQuery(invalidId, QueryRequestDto.builder().name("Test").build());
        assertFalse(result.isPresent());
        verify(dataQueryRepository, never()).save(any());
    }
    @Test
    @DisplayName("PASS: Delete existing query returns true")
    void testDeleteQuery_Success() {
        when(dataQueryRepository.findById(queryId)).thenReturn(Optional.of(mockQuery));
        boolean deleted = queryApplicationService.deleteQuery(queryId);
        assertTrue(deleted);
        verify(dataQueryRepository, times(1)).delete(mockQuery);
    }
    @Test
    @DisplayName("FAIL/EDGE: Delete non-existing query returns false")
    void testDeleteQuery_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dataQueryRepository.findById(invalidId)).thenReturn(Optional.empty());
        boolean deleted = queryApplicationService.deleteQuery(invalidId);
        assertFalse(deleted);
        verify(dataQueryRepository, never()).delete(any());
    }
    @Test
    @DisplayName("PASS: Duplicate query creates new copy with suffix")
    void testDuplicateQuery_Success() {
        when(dataQueryRepository.findById(queryId)).thenReturn(Optional.of(mockQuery));
        when(userAccountRepository.findByUsername("ahaddad")).thenReturn(Optional.of(mockUser));
        when(dataQueryRepository.save(any(DataQueryEntity.class))).thenAnswer(i -> {
            DataQueryEntity q = i.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });
        Optional<QueryResponseDto> duplicated = queryApplicationService.duplicateQuery(queryId);
        assertTrue(duplicated.isPresent());
        assertEquals("Chiffre d'affaires par Client (copie)", duplicated.get().getName());
        assertEquals("shared", duplicated.get().getVisibility());
    }
    @Test
    @DisplayName("FAIL/EDGE: Duplicate non-existing query returns Optional.empty()")
    void testDuplicateQuery_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dataQueryRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<QueryResponseDto> result = queryApplicationService.duplicateQuery(invalidId);
        assertFalse(result.isPresent());
    }
}
