package com.dynamicdashboard.cockpit.dashboard.controller;
import com.dynamicdashboard.cockpit.dashboard.application.DashboardApplicationService;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DashboardRequestDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DashboardResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {
    private MockMvc mockMvc;
    @Mock
    private DashboardApplicationService dashboardApplicationService;
    @InjectMocks
    private DashboardController dashboardController;
    private ObjectMapper objectMapper;
    private UUID dashboardId;
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(dashboardController).build();
        objectMapper = new ObjectMapper();
        dashboardId = UUID.randomUUID();
    }
    @Test
    @DisplayName("PASS: GET /api/dashboards returns 200 OK and dashboard list")
    void testGetAllDashboards_Returns200() throws Exception {
        DashboardResponseDto dto = DashboardResponseDto.builder()
                .id(dashboardId)
                .name("Ventes 2026")
                .status("published")
                .build();
        when(dashboardApplicationService.getAllDashboards()).thenReturn(List.of(dto));
        mockMvc.perform(get("/api/dashboards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Ventes 2026"));
    }
    @Test
    @DisplayName("PASS: GET /api/dashboards/{id} returns 200 OK when found")
    void testGetDashboardById_Returns200() throws Exception {
        DashboardResponseDto dto = DashboardResponseDto.builder()
                .id(dashboardId)
                .name("Ventes 2026")
                .build();
        when(dashboardApplicationService.getDashboardById(dashboardId)).thenReturn(Optional.of(dto));
        mockMvc.perform(get("/api/dashboards/" + dashboardId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ventes 2026"));
    }
    @Test
    @DisplayName("FAIL/EDGE: GET /api/dashboards/{id} returns 404 NOT FOUND when non-existent")
    void testGetDashboardById_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(dashboardApplicationService.getDashboardById(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/dashboards/" + invalidId))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: POST /api/dashboards returns 201 CREATED")
    void testCreateDashboard_Returns201() throws Exception {
        DashboardRequestDto request = DashboardRequestDto.builder()
                .name("Nouveau Dashboard")
                .status("draft")
                .build();
        DashboardResponseDto response = DashboardResponseDto.builder()
                .id(dashboardId)
                .name("Nouveau Dashboard")
                .status("draft")
                .build();
        when(dashboardApplicationService.createDashboard(any(DashboardRequestDto.class))).thenReturn(response);
        mockMvc.perform(post("/api/dashboards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nouveau Dashboard"));
    }
    @Test
    @DisplayName("PASS: PUT /api/dashboards/{id} returns 200 OK when updated")
    void testUpdateDashboard_Returns200() throws Exception {
        DashboardRequestDto request = DashboardRequestDto.builder().name("Nom Modifié").build();
        DashboardResponseDto response = DashboardResponseDto.builder().id(dashboardId).name("Nom Modifié").build();
        when(dashboardApplicationService.updateDashboard(eq(dashboardId), any(DashboardRequestDto.class))).thenReturn(Optional.of(response));
        mockMvc.perform(put("/api/dashboards/" + dashboardId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nom Modifié"));
    }
    @Test
    @DisplayName("FAIL/EDGE: PUT /api/dashboards/{id} returns 404 NOT FOUND when non-existent")
    void testUpdateDashboard_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        DashboardRequestDto request = DashboardRequestDto.builder().name("Test").build();
        when(dashboardApplicationService.updateDashboard(eq(invalidId), any(DashboardRequestDto.class))).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/dashboards/" + invalidId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: DELETE /api/dashboards/{id} returns 204 NO CONTENT when deleted")
    void testDeleteDashboard_Returns204() throws Exception {
        when(dashboardApplicationService.deleteDashboard(dashboardId)).thenReturn(true);
        mockMvc.perform(delete("/api/dashboards/" + dashboardId))
                .andExpect(status().isNoContent());
    }
    @Test
    @DisplayName("FAIL/EDGE: DELETE /api/dashboards/{id} returns 404 NOT FOUND when non-existent")
    void testDeleteDashboard_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(dashboardApplicationService.deleteDashboard(invalidId)).thenReturn(false);
        mockMvc.perform(delete("/api/dashboards/" + invalidId))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: POST /api/dashboards/{id}/duplicate returns 201 CREATED")
    void testDuplicateDashboard_Returns201() throws Exception {
        DashboardResponseDto response = DashboardResponseDto.builder().id(UUID.randomUUID()).name("Copie").build();
        when(dashboardApplicationService.duplicateDashboard(dashboardId)).thenReturn(Optional.of(response));
        mockMvc.perform(post("/api/dashboards/" + dashboardId + "/duplicate"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Copie"));
    }
    @Test
    @DisplayName("FAIL/EDGE: POST /api/dashboards/{id}/duplicate returns 404 NOT FOUND when source invalid")
    void testDuplicateDashboard_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(dashboardApplicationService.duplicateDashboard(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(post("/api/dashboards/" + invalidId + "/duplicate"))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: PATCH /api/dashboards/{id}/favorite returns 200 OK")
    void testToggleFavorite_Returns200() throws Exception {
        DashboardResponseDto response = DashboardResponseDto.builder().id(dashboardId).favorite(true).build();
        when(dashboardApplicationService.toggleFavorite(dashboardId)).thenReturn(Optional.of(response));
        mockMvc.perform(patch("/api/dashboards/" + dashboardId + "/favorite"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite").value(true));
    }
    @Test
    @DisplayName("FAIL/EDGE: PATCH /api/dashboards/{id}/favorite returns 404 NOT FOUND when invalid")
    void testToggleFavorite_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(dashboardApplicationService.toggleFavorite(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(patch("/api/dashboards/" + invalidId + "/favorite"))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: PATCH /api/dashboards/{id}/archive returns 200 OK")
    void testToggleArchive_Returns200() throws Exception {
        DashboardResponseDto response = DashboardResponseDto.builder().id(dashboardId).archived(true).build();
        when(dashboardApplicationService.toggleArchive(dashboardId)).thenReturn(Optional.of(response));
        mockMvc.perform(patch("/api/dashboards/" + dashboardId + "/archive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived").value(true));
    }
    @Test
    @DisplayName("FAIL/EDGE: PATCH /api/dashboards/{id}/archive returns 404 NOT FOUND when invalid")
    void testToggleArchive_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(dashboardApplicationService.toggleArchive(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(patch("/api/dashboards/" + invalidId + "/archive"))
                .andExpect(status().isNotFound());
    }
}
