package com.dynamicdashboard.cockpit.catalog.controller;
import com.dynamicdashboard.cockpit.catalog.application.CatalogApplicationService;
import com.dynamicdashboard.cockpit.catalog.application.dto.DataFieldDto;
import com.dynamicdashboard.cockpit.catalog.application.dto.DataSourceDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@ExtendWith(MockitoExtension.class)
class CatalogControllerTest {
    private MockMvc mockMvc;
    @Mock
    private CatalogApplicationService catalogApplicationService;
    @InjectMocks
    private CatalogController catalogController;
    private UUID sourceId;
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(catalogController).build();
        sourceId = UUID.randomUUID();
    }
    @Test
    @DisplayName("PASS: GET /api/catalog/data-sources returns 200 OK and list")
    void testGetAllDataSources_Returns200() throws Exception {
        DataSourceDto dto = DataSourceDto.builder()
                .id(sourceId)
                .key("src-factures")
                .label("Factures")
                .app("ProgesCode")
                .active(true)
                .fields(Collections.emptyList())
                .build();
        when(catalogApplicationService.getAllDataSources()).thenReturn(List.of(dto));
        mockMvc.perform(get("/api/catalog/data-sources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].key").value("src-factures"));
    }
    @Test
    @DisplayName("PASS: GET /api/catalog/data-sources/{id} returns 200 OK when found")
    void testGetDataSourceById_Returns200() throws Exception {
        DataSourceDto dto = DataSourceDto.builder()
                .id(sourceId)
                .key("src-factures")
                .label("Factures")
                .build();
        when(catalogApplicationService.getDataSourceById(sourceId)).thenReturn(Optional.of(dto));
        mockMvc.perform(get("/api/catalog/data-sources/" + sourceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("src-factures"));
    }
    @Test
    @DisplayName("FAIL/EDGE: GET /api/catalog/data-sources/{id} returns 404 NOT FOUND when non-existent")
    void testGetDataSourceById_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(catalogApplicationService.getDataSourceById(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/catalog/data-sources/" + invalidId))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: GET /api/catalog/data-sources/{id}/fields returns 200 OK and field list")
    void testGetFieldsByDataSourceId_Returns200() throws Exception {
        DataFieldDto fieldDto = DataFieldDto.builder()
                .id(UUID.randomUUID())
                .key("f-num")
                .label("N° Facture")
                .type("text")
                .build();
        when(catalogApplicationService.getFieldsByDataSourceId(sourceId)).thenReturn(List.of(fieldDto));
        mockMvc.perform(get("/api/catalog/data-sources/" + sourceId + "/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].key").value("f-num"));
    }
}
