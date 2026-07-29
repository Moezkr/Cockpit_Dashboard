package com.dynamicdashboard.cockpit.catalog.application;
import com.dynamicdashboard.cockpit.catalog.application.dto.DataFieldDto;
import com.dynamicdashboard.cockpit.catalog.application.dto.DataSourceDto;
import com.dynamicdashboard.cockpit.catalog.domain.DataFieldEntity;
import com.dynamicdashboard.cockpit.catalog.domain.DataSourceEntity;
import com.dynamicdashboard.cockpit.catalog.repository.DataFieldRepository;
import com.dynamicdashboard.cockpit.catalog.repository.DataSourceRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.FieldType;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.HostApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.dynamicdashboard.cockpit.catalog.application.mapper.CatalogMapper;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CatalogApplicationServiceTest {
    @Mock
    private DataSourceRepository dataSourceRepository;
    @Mock
    private DataFieldRepository dataFieldRepository;
    @Mock
    private CatalogMapper catalogMapper;
    @InjectMocks
    private CatalogApplicationService catalogApplicationService;
    private DataSourceEntity mockSource;
    private DataFieldEntity mockField;
    private UUID sourceId;
    @BeforeEach
    void setUp() {
        sourceId = UUID.randomUUID();
        mockSource = new DataSourceEntity();
        mockSource.setId(sourceId);
        mockSource.setSourceKey("src-factures");
        mockSource.setSourceLabel("Factures");
        mockSource.setSourceDescription("Factures clients");
        mockSource.setHostApplication(HostApplication.PROGES_CODE);
        mockSource.setActive(true);
        mockField = new DataFieldEntity();
        mockField.setId(UUID.randomUUID());
        mockField.setDataSource(mockSource);
        mockField.setFieldKey("f-num");
        mockField.setFieldLabel("N° Facture");
        mockField.setFieldType(FieldType.TEXT);
        mockField.setNullable(true);

        when(catalogMapper.toDataSourceDto(any(DataSourceEntity.class))).thenAnswer(invocation -> {
            DataSourceEntity s = invocation.getArgument(0);
            return DataSourceDto.builder()
                    .id(s.getId())
                    .key(s.getSourceKey())
                    .label(s.getSourceLabel())
                    .app(s.getHostApplication() != null ? s.getHostApplication().name() : "PROGES_CODE")
                    .fields(List.of(DataFieldDto.builder().id(mockField.getId()).key(mockField.getFieldKey()).label(mockField.getFieldLabel()).type("text").build()))
                    .build();
        });
        when(catalogMapper.toDataFieldDto(any(DataFieldEntity.class))).thenAnswer(invocation -> {
            DataFieldEntity f = invocation.getArgument(0);
            return DataFieldDto.builder()
                    .id(f.getId())
                    .key(f.getFieldKey())
                    .label(f.getFieldLabel())
                    .type(f.getFieldType() != null ? f.getFieldType().name().toLowerCase() : "text")
                    .build();
        });
    }
    @Test
    @DisplayName("PASS: Retrieve all data sources successfully")
    void testGetAllDataSources_Success() {
        when(dataSourceRepository.findAll()).thenReturn(List.of(mockSource));
        when(dataFieldRepository.findByDataSourceId(sourceId)).thenReturn(List.of(mockField));
        List<DataSourceDto> sources = catalogApplicationService.getAllDataSources();
        assertNotNull(sources);
        assertEquals(1, sources.size());
        assertEquals("Factures", sources.get(0).getLabel());
        assertEquals("PROGES_CODE", sources.get(0).getApp());
        assertEquals(1, sources.get(0).getFields().size());
    }
    @Test
    @DisplayName("PASS: Get data source by valid ID returns DTO")
    void testGetDataSourceById_Found() {
        when(dataSourceRepository.findById(sourceId)).thenReturn(Optional.of(mockSource));
        when(dataFieldRepository.findByDataSourceId(sourceId)).thenReturn(List.of(mockField));
        Optional<DataSourceDto> result = catalogApplicationService.getDataSourceById(sourceId);
        assertTrue(result.isPresent());
        assertEquals("src-factures", result.get().getKey());
    }
    @Test
    @DisplayName("FAIL/EDGE: Get data source by invalid ID returns Optional.empty()")
    void testGetDataSourceById_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dataSourceRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<DataSourceDto> result = catalogApplicationService.getDataSourceById(invalidId);
        assertFalse(result.isPresent());
    }
    @Test
    @DisplayName("PASS: Retrieve fields by data source ID returns mapped field list")
    void testGetFieldsByDataSourceId_Success() {
        when(dataFieldRepository.findByDataSourceId(sourceId)).thenReturn(List.of(mockField));
        List<DataFieldDto> fields = catalogApplicationService.getFieldsByDataSourceId(sourceId);
        assertNotNull(fields);
        assertEquals(1, fields.size());
        assertEquals("f-num", fields.get(0).getKey());
        assertEquals("text", fields.get(0).getType());
    }
    @Test
    @DisplayName("FAIL/EDGE: Retrieve fields for data source with no fields returns empty list")
    void testGetFieldsByDataSourceId_Empty() {
        when(dataFieldRepository.findByDataSourceId(sourceId)).thenReturn(Collections.emptyList());
        List<DataFieldDto> fields = catalogApplicationService.getFieldsByDataSourceId(sourceId);
        assertNotNull(fields);
        assertTrue(fields.isEmpty());
    }

}
