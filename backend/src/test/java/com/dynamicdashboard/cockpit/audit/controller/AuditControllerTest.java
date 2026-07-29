package com.dynamicdashboard.cockpit.audit.controller;
import com.dynamicdashboard.cockpit.audit.application.AuditApplicationService;
import com.dynamicdashboard.cockpit.audit.application.dto.AuditEventDto;
import com.dynamicdashboard.cockpit.audit.application.dto.CreateAuditEventRequestDto;
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
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@ExtendWith(MockitoExtension.class)
class AuditControllerTest {
    private MockMvc mockMvc;
    @Mock
    private AuditApplicationService auditApplicationService;
    @InjectMocks
    private AuditController auditController;
    private ObjectMapper objectMapper;
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(auditController).build();
        objectMapper = new ObjectMapper();
    }
    @Test
    @DisplayName("PASS: GET /api/audit-events returns 200 OK and event list")
    void testGetRecentEvents_Returns200AndList() throws Exception {
        AuditEventDto dto = AuditEventDto.builder()
                .id(UUID.randomUUID())
                .actorName("Amine Haddad")
                .eventType("LOGIN")
                .targetType("USER")
                .occurredAt(Instant.now())
                .build();
        when(auditApplicationService.getRecentEvents()).thenReturn(List.of(dto));
        mockMvc.perform(get("/api/audit-events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventType").value("LOGIN"))
                .andExpect(jsonPath("$[0].actorName").value("Amine Haddad"));
    }
    @Test
    @DisplayName("PASS: POST /api/audit-events returns 201 Created and new event")
    void testLogAuditEvent_Returns201Created() throws Exception {
        CreateAuditEventRequestDto request = CreateAuditEventRequestDto.builder()
                .eventType("DASHBOARD_UPDATE")
                .targetType("DASHBOARD")
                .targetId(UUID.randomUUID())
                .build();
        AuditEventDto response = AuditEventDto.builder()
                .id(UUID.randomUUID())
                .actorName("System")
                .eventType("DASHBOARD_UPDATE")
                .targetType("DASHBOARD")
                .build();
        when(auditApplicationService.logAuditEvent(any(CreateAuditEventRequestDto.class))).thenReturn(response);
        mockMvc.perform(post("/api/audit-events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("DASHBOARD_UPDATE"));
    }
    @Test
    @DisplayName("FAIL/EDGE: GET /api/audit-events returns empty array when no events found")
    void testGetRecentEvents_Returns200Empty() throws Exception {
        when(auditApplicationService.getRecentEvents()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/audit-events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
