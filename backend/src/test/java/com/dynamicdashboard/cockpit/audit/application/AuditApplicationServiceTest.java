package com.dynamicdashboard.cockpit.audit.application;
import com.dynamicdashboard.cockpit.audit.application.dto.AuditEventDto;
import com.dynamicdashboard.cockpit.audit.application.dto.CreateAuditEventRequestDto;
import com.dynamicdashboard.cockpit.audit.domain.AuditEventEntity;
import com.dynamicdashboard.cockpit.audit.repository.AuditEventRepository;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.dynamicdashboard.cockpit.audit.application.mapper.AuditMapper;
import com.dynamicdashboard.cockpit.shared.security.CurrentUserService;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuditApplicationServiceTest {
    @Mock
    private AuditEventRepository auditEventRepository;
    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private AuditMapper auditMapper;
    @InjectMocks
    private AuditApplicationService auditApplicationService;
    private UserAccountEntity mockUser;
    @BeforeEach
    void setUp() {
        mockUser = new UserAccountEntity();
        mockUser.setId(UUID.randomUUID());
        mockUser.setUsername("ahaddad");
        mockUser.setDisplayName("Amine Haddad");

        when(currentUserService.getCurrentUser()).thenReturn(mockUser);
        when(auditMapper.toDto(any())).thenAnswer(invocation -> {
            AuditEventEntity e = invocation.getArgument(0);
            return AuditEventDto.builder()
                    .id(e.getId() != null ? e.getId() : UUID.randomUUID())
                    .actorName(e.getActorUser() != null ? e.getActorUser().getDisplayName() : "Système")
                    .eventType(e.getEventType() != null ? e.getEventType() : "GENERIC_EVENT")
                    .targetType(e.getTargetType() != null ? e.getTargetType() : "SYSTEM")
                    .targetId(e.getTargetId())
                    .sourceIp(e.getSourceIp() != null ? e.getSourceIp() : "127.0.0.1")
                    .build();
        });
    }
    @Test
    @DisplayName("PASS: Log audit event with full parameters")
    void testLogAuditEvent_Success() {
        UUID targetUuid = UUID.randomUUID();
        CreateAuditEventRequestDto request = CreateAuditEventRequestDto.builder()
                .eventType("DASHBOARD_CREATE")
                .targetType("DASHBOARD")
                .targetId(targetUuid)
                .detailsJson("{\"name\":\"Test Dashboard\"}")
                .sourceIp("192.168.1.50")
                .build();
        when(userAccountRepository.findByUsername("ahaddad")).thenReturn(Optional.of(mockUser));
        when(auditEventRepository.save(any(AuditEventEntity.class))).thenAnswer(invocation -> {
            AuditEventEntity entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });
        AuditEventDto result = auditApplicationService.logAuditEvent(request);
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals("Amine Haddad", result.getActorName());
        assertEquals("DASHBOARD_CREATE", result.getEventType());
        assertEquals("DASHBOARD", result.getTargetType());
        assertEquals(request.getTargetId(), result.getTargetId());
        assertEquals("127.0.0.1", result.getSourceIp());
        verify(auditEventRepository, times(1)).save(any(AuditEventEntity.class));
    }
    @Test
    @DisplayName("PASS: Log audit event with null fields triggers default fallbacks")
    void testLogAuditEvent_DefaultFallbacks() {
        CreateAuditEventRequestDto request = CreateAuditEventRequestDto.builder()
                .eventType(null)
                .targetType(null)
                .sourceIp(null)
                .build();
        when(userAccountRepository.findByUsername("ahaddad")).thenReturn(Optional.empty());
        when(currentUserService.getCurrentUser()).thenReturn(null);
        when(auditEventRepository.save(any(AuditEventEntity.class))).thenAnswer(invocation -> {
            AuditEventEntity entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });
        AuditEventDto result = auditApplicationService.logAuditEvent(request);
        assertNotNull(result);
        assertEquals("Système", result.getActorName());
        assertEquals("GENERIC_EVENT", result.getEventType());
        assertEquals("DASHBOARD", result.getTargetType());
        assertEquals("127.0.0.1", result.getSourceIp());
    }
    @Test
    @DisplayName("PASS: Retrieve recent events returns mapped DTO list")
    void testGetRecentEvents_Success() {
        AuditEventEntity event = new AuditEventEntity();
        event.setId(UUID.randomUUID());
        event.setActorUser(mockUser);
        event.setEventType("QUERY_EXECUTE");
        event.setTargetType("QUERY");
        event.setOccurredAt(Instant.now());
        when(auditEventRepository.findAllByOrderByOccurredAtDesc()).thenReturn(List.of(event));
        List<AuditEventDto> events = auditApplicationService.getRecentEvents();
        assertNotNull(events);
        assertEquals(1, events.size());
        assertEquals("QUERY_EXECUTE", events.get(0).getEventType());
        assertEquals("Amine Haddad", events.get(0).getActorName());
    }
    @Test
    @DisplayName("FAIL/EDGE: Retrieve recent events when database is empty returns empty list")
    void testGetRecentEvents_EmptyList() {
        when(auditEventRepository.findAllByOrderByOccurredAtDesc()).thenReturn(Collections.emptyList());
        List<AuditEventDto> events = auditApplicationService.getRecentEvents();
        assertNotNull(events);
        assertTrue(events.isEmpty());
    }
}
