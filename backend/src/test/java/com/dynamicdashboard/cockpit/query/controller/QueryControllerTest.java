package com.dynamicdashboard.cockpit.query.controller;
import com.dynamicdashboard.cockpit.query.application.QueryApplicationService;
import com.dynamicdashboard.cockpit.query.application.dto.QueryRequestDto;
import com.dynamicdashboard.cockpit.query.application.dto.QueryResponseDto;
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
class QueryControllerTest {
    private MockMvc mockMvc;
    @Mock
    private QueryApplicationService queryApplicationService;
    @InjectMocks
    private QueryController queryController;
    private ObjectMapper objectMapper;
    private UUID queryId;
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(queryController).build();
        objectMapper = new ObjectMapper();
        queryId = UUID.randomUUID();
    }
    @Test
    @DisplayName("PASS: GET /api/queries returns 200 OK and query list")
    void testGetAllQueries_Returns200() throws Exception {
        QueryResponseDto dto = QueryResponseDto.builder()
                .id(queryId)
                .name("Requête Factures")
                .visibility("shared")
                .build();
        when(queryApplicationService.getAllQueries()).thenReturn(List.of(dto));
        mockMvc.perform(get("/api/queries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Requête Factures"));
    }
    @Test
    @DisplayName("PASS: GET /api/queries/{id} returns 200 OK when found")
    void testGetQueryById_Returns200() throws Exception {
        QueryResponseDto dto = QueryResponseDto.builder()
                .id(queryId)
                .name("Requête Factures")
                .build();
        when(queryApplicationService.getQueryById(queryId)).thenReturn(Optional.of(dto));
        mockMvc.perform(get("/api/queries/" + queryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Requête Factures"));
    }
    @Test
    @DisplayName("FAIL/EDGE: GET /api/queries/{id} returns 404 NOT FOUND when non-existent")
    void testGetQueryById_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(queryApplicationService.getQueryById(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/queries/" + invalidId))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: POST /api/queries returns 201 CREATED")
    void testCreateQuery_Returns201() throws Exception {
        QueryRequestDto request = QueryRequestDto.builder()
                .name("Nouvelle Requête")
                .visibility("personal")
                .build();
        QueryResponseDto response = QueryResponseDto.builder()
                .id(queryId)
                .name("Nouvelle Requête")
                .visibility("personal")
                .build();
        when(queryApplicationService.createQuery(any(QueryRequestDto.class))).thenReturn(response);
        mockMvc.perform(post("/api/queries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nouvelle Requête"));
    }
    @Test
    @DisplayName("PASS: PUT /api/queries/{id} returns 200 OK when updated")
    void testUpdateQuery_Returns200() throws Exception {
        QueryRequestDto request = QueryRequestDto.builder().name("Requête Modifiée").build();
        QueryResponseDto response = QueryResponseDto.builder().id(queryId).name("Requête Modifiée").build();
        when(queryApplicationService.updateQuery(eq(queryId), any(QueryRequestDto.class))).thenReturn(Optional.of(response));
        mockMvc.perform(put("/api/queries/" + queryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Requête Modifiée"));
    }
    @Test
    @DisplayName("FAIL/EDGE: PUT /api/queries/{id} returns 404 NOT FOUND when non-existent")
    void testUpdateQuery_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        QueryRequestDto request = QueryRequestDto.builder().name("Test").build();
        when(queryApplicationService.updateQuery(eq(invalidId), any(QueryRequestDto.class))).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/queries/" + invalidId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: DELETE /api/queries/{id} returns 204 NO CONTENT when deleted")
    void testDeleteQuery_Returns204() throws Exception {
        when(queryApplicationService.deleteQuery(queryId)).thenReturn(true);
        mockMvc.perform(delete("/api/queries/" + queryId))
                .andExpect(status().isNoContent());
    }
    @Test
    @DisplayName("FAIL/EDGE: DELETE /api/queries/{id} returns 404 NOT FOUND when non-existent")
    void testDeleteQuery_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(queryApplicationService.deleteQuery(invalidId)).thenReturn(false);
        mockMvc.perform(delete("/api/queries/" + invalidId))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("PASS: POST /api/queries/{id}/duplicate returns 201 CREATED")
    void testDuplicateQuery_Returns201() throws Exception {
        QueryResponseDto response = QueryResponseDto.builder().id(UUID.randomUUID()).name("Copie").build();
        when(queryApplicationService.duplicateQuery(queryId)).thenReturn(Optional.of(response));
        mockMvc.perform(post("/api/queries/" + queryId + "/duplicate"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Copie"));
    }
    @Test
    @DisplayName("FAIL/EDGE: POST /api/queries/{id}/duplicate returns 404 NOT FOUND when source invalid")
    void testDuplicateQuery_Returns404() throws Exception {
        UUID invalidId = UUID.randomUUID();
        when(queryApplicationService.duplicateQuery(invalidId)).thenReturn(Optional.empty());
        mockMvc.perform(post("/api/queries/" + invalidId + "/duplicate"))
                .andExpect(status().isNotFound());
    }
}
