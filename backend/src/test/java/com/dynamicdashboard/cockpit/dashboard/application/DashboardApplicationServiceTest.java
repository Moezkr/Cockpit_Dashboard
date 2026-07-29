package com.dynamicdashboard.cockpit.dashboard.application;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DataGridConfigDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DashboardRequestDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DashboardResponseDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.GlobalFilterDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.WidgetDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.WidgetLayoutDto;
import com.dynamicdashboard.cockpit.dashboard.domain.DashboardEntity;
import com.dynamicdashboard.cockpit.dashboard.repository.DashboardRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.DashboardTagRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.GlobalFilterOptionRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.GlobalFilterRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.GlobalFilterValueMapRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.WidgetDatagridConfigRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.WidgetDatagridVisibleColumnRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.WidgetFilterRepository;
import com.dynamicdashboard.cockpit.dashboard.repository.WidgetRepository;
import com.dynamicdashboard.cockpit.identity.domain.UserAccountEntity;
import com.dynamicdashboard.cockpit.identity.repository.UserAccountRepository;
import com.dynamicdashboard.cockpit.query.repository.DataQueryRepository;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.DashboardDensity;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.DashboardStatus;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.RefreshInterval;
import com.dynamicdashboard.cockpit.shared.domain.DomainEnums.ShareLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.dynamicdashboard.cockpit.dashboard.application.mapper.DashboardMapper;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardApplicationServiceTest {
    @Mock private DashboardRepository dashboardRepository;
    @Mock private WidgetRepository widgetRepository;
    @Mock private GlobalFilterRepository globalFilterRepository;
    @Mock private DashboardTagRepository dashboardTagRepository;
    @Mock private WidgetDatagridConfigRepository widgetDatagridConfigRepository;
    @Mock private WidgetDatagridVisibleColumnRepository widgetDatagridVisibleColumnRepository;
    @Mock private WidgetFilterRepository widgetFilterRepository;
    @Mock private GlobalFilterOptionRepository globalFilterOptionRepository;
    @Mock private GlobalFilterValueMapRepository globalFilterValueMapRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private DataQueryRepository dataQueryRepository;
    @Mock private com.dynamicdashboard.cockpit.catalog.repository.DataFieldRepository dataFieldRepository;
    @Mock private com.dynamicdashboard.cockpit.shared.security.CurrentUserService currentUserService;
    @Mock private com.dynamicdashboard.cockpit.audit.application.AuditApplicationService auditApplicationService;
    @Mock private DashboardMapper dashboardMapper;
    @InjectMocks
    private DashboardApplicationService dashboardApplicationService;
    private DashboardEntity mockDashboard;
    private UserAccountEntity mockUser;
    private UUID dashboardId;
    @BeforeEach
    void setUp() {
        dashboardId = UUID.randomUUID();
        mockUser = new UserAccountEntity();
        mockUser.setId(UUID.randomUUID());
        mockUser.setDisplayName("Admin System");
        mockDashboard = new DashboardEntity();
        mockDashboard.setId(dashboardId);
        mockDashboard.setDashboardName("Tableau de bord Ventes");
        mockDashboard.setDashboardDescription("Suivi du CA et des paiements");
        mockDashboard.setColorHex("#2563eb");
        mockDashboard.setStatus(DashboardStatus.PUBLISHED);
        mockDashboard.setShareLevel(ShareLevel.USERS);
        mockDashboard.setColumnsCount(12);
        mockDashboard.setDensity(DashboardDensity.NORMAL);
        mockDashboard.setRefreshInterval(RefreshInterval.OFF);
        mockDashboard.setOwner(mockUser);
        mockDashboard.setFavorite(true);
        mockDashboard.setArchived(false);

        when(dashboardTagRepository.findByIdDashboardId(any())).thenReturn(Collections.emptyList());
        when(globalFilterRepository.findByDashboardId(any())).thenReturn(Collections.emptyList());
        when(widgetRepository.findByDashboardId(any())).thenReturn(Collections.emptyList());
        when(widgetFilterRepository.findByWidgetIdOrderByPositionIndexAsc(any())).thenReturn(Collections.emptyList());
        when(widgetDatagridConfigRepository.findById(any())).thenReturn(Optional.empty());
        when(currentUserService.getCurrentUser()).thenReturn(mockUser);
        when(dashboardMapper.toDto(any())).thenAnswer(invocation -> {
            DashboardEntity entity = invocation.getArgument(0);
            return DashboardResponseDto.builder()
                    .id(entity.getId())
                    .name(entity.getDashboardName())
                    .description(entity.getDashboardDescription())
                    .owner(entity.getOwner() != null ? entity.getOwner().getDisplayName() : "Admin System")
                    .favorite(entity.isFavorite())
                    .archived(entity.isArchived())
                    .build();
        });
    }
    @Test
    @DisplayName("PASS: Retrieve all dashboards successfully")
    void testGetAllDashboards_Success() {
        when(dashboardRepository.findAll()).thenReturn(List.of(mockDashboard));
        List<DashboardResponseDto> result = dashboardApplicationService.getAllDashboards();
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Tableau de bord Ventes", result.get(0).getName());
        assertEquals("Admin System", result.get(0).getOwner());
    }
    @Test
    @DisplayName("PASS: Get dashboard by valid ID returns mapped DTO")
    void testGetDashboardById_Found() {
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(mockDashboard));
        Optional<DashboardResponseDto> result = dashboardApplicationService.getDashboardById(dashboardId);
        assertTrue(result.isPresent());
        assertEquals("Tableau de bord Ventes", result.get().getName());
        assertTrue(result.get().isFavorite());
    }
    @Test
    @DisplayName("FAIL/EDGE: Get dashboard by non-existing ID returns Optional.empty()")
    void testGetDashboardById_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dashboardRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<DashboardResponseDto> result = dashboardApplicationService.getDashboardById(invalidId);
        assertFalse(result.isPresent());
    }
    @Test
    @DisplayName("PASS: Create new dashboard with tags, filters, and widgets")
    void testCreateDashboard_Success() {
        WidgetDto widget = WidgetDto.builder()
                .type("kpi")
                .title("Chiffre d'Affaires")
                .showTitle(true)
                .layout(new WidgetLayoutDto(0, 0, 4, 3))
                .datagrid(DataGridConfigDto.builder().rowsPerPage(10).density("compact").visibleColumns(List.of("col1")).build())
                .build();
        GlobalFilterDto filter = GlobalFilterDto.builder()
                .name("region")
                .label("Région")
                .input("select")
                .options(List.of("Nord", "Sud"))
                .valueMap(Map.of("Nord", "N"))
                .build();
        DashboardRequestDto request = DashboardRequestDto.builder()
                .name("Nouveau Dashboard Test")
                .description("Description Test")
                .color("#10b981")
                .status("draft")
                .shareLevel("private")
                .columns(12)
                .density("normal")
                .refreshInterval("off")
                .tags(List.of("Finance", "ProgesCode"))
                .globalFilters(List.of(filter))
                .widgets(List.of(widget))
                .build();
        when(currentUserService.getCurrentUser()).thenReturn(mockUser);
        when(dashboardRepository.save(any(DashboardEntity.class))).thenAnswer(i -> {
            DashboardEntity e = i.getArgument(0);
            e.setId(dashboardId);
            return e;
        });
        when(widgetRepository.save(any())).thenAnswer(i -> {
            var w = i.getArgument(0, com.dynamicdashboard.cockpit.dashboard.domain.WidgetEntity.class);
            w.setId(UUID.randomUUID());
            return w;
        });
        when(globalFilterRepository.save(any())).thenAnswer(i -> {
            var gf = i.getArgument(0, com.dynamicdashboard.cockpit.dashboard.domain.GlobalFilterEntity.class);
            gf.setId(UUID.randomUUID());
            return gf;
        });
        DashboardResponseDto response = dashboardApplicationService.createDashboard(request);
        assertNotNull(response);
        assertEquals(dashboardId, response.getId());
        assertEquals("Nouveau Dashboard Test", response.getName());
        verify(dashboardRepository, times(1)).save(any(DashboardEntity.class));
        verify(dashboardTagRepository, times(2)).save(any());
        verify(globalFilterRepository, times(1)).save(any());
        verify(widgetRepository, times(1)).save(any());
    }
    @Test
    @DisplayName("PASS: Update existing dashboard details")
    void testUpdateDashboard_Found_Success() {
        DashboardRequestDto updateRequest = DashboardRequestDto.builder()
                .name("Tableau Ventes Mis à Jour")
                .status("published")
                .tags(Collections.emptyList())
                .build();
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(mockDashboard));
        when(dashboardRepository.save(any(DashboardEntity.class))).thenAnswer(i -> i.getArgument(0));
        Optional<DashboardResponseDto> result = dashboardApplicationService.updateDashboard(dashboardId, updateRequest);
        assertTrue(result.isPresent());
        assertEquals("Tableau Ventes Mis à Jour", result.get().getName());
        verify(dashboardTagRepository, times(1)).deleteAll(anyList());
        verify(globalFilterRepository, times(1)).deleteAll(anyList());
        verify(widgetRepository, times(1)).deleteAll(anyList());
    }
    @Test
    @DisplayName("FAIL/EDGE: Update non-existing dashboard returns Optional.empty()")
    void testUpdateDashboard_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dashboardRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<DashboardResponseDto> result = dashboardApplicationService.updateDashboard(invalidId, DashboardRequestDto.builder().name("Test").build());
        assertFalse(result.isPresent());
        verify(dashboardRepository, never()).save(any());
    }
    @Test
    @DisplayName("PASS: Delete existing dashboard returns true")
    void testDeleteDashboard_Success() {
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(mockDashboard));
        boolean deleted = dashboardApplicationService.deleteDashboard(dashboardId);
        assertTrue(deleted);
        verify(dashboardRepository, times(1)).deleteById(dashboardId);
    }
    @Test
    @DisplayName("FAIL/EDGE: Delete non-existing dashboard returns false")
    void testDeleteDashboard_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dashboardRepository.existsById(invalidId)).thenReturn(false);
        boolean deleted = dashboardApplicationService.deleteDashboard(invalidId);
        assertFalse(deleted);
        verify(dashboardRepository, never()).deleteById(any());
    }
    @Test
    @DisplayName("PASS: Duplicate dashboard creates new draft copy with suffix")
    void testDuplicateDashboard_Success() {
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(mockDashboard));
        when(currentUserService.getCurrentUser()).thenReturn(mockUser);
        when(dashboardRepository.save(any(DashboardEntity.class))).thenAnswer(i -> {
            DashboardEntity e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        Optional<DashboardResponseDto> duplicated = dashboardApplicationService.duplicateDashboard(dashboardId);
        assertTrue(duplicated.isPresent());
        assertEquals("Tableau de bord Ventes (copie)", duplicated.get().getName());
        assertFalse(duplicated.get().isFavorite());
    }
    @Test
    @DisplayName("FAIL/EDGE: Duplicate non-existing dashboard returns Optional.empty()")
    void testDuplicateDashboard_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dashboardRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<DashboardResponseDto> duplicated = dashboardApplicationService.duplicateDashboard(invalidId);
        assertFalse(duplicated.isPresent());
    }
    @Test
    @DisplayName("PASS: Toggle favorite flips favorite boolean flag")
    void testToggleFavorite_Success() {
        mockDashboard.setFavorite(true);
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(mockDashboard));
        when(dashboardRepository.save(any(DashboardEntity.class))).thenAnswer(i -> i.getArgument(0));
        Optional<DashboardResponseDto> result = dashboardApplicationService.toggleFavorite(dashboardId);
        assertTrue(result.isPresent());
        assertFalse(result.get().isFavorite());
    }
    @Test
    @DisplayName("FAIL/EDGE: Toggle favorite on non-existing dashboard returns Optional.empty()")
    void testToggleFavorite_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dashboardRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<DashboardResponseDto> result = dashboardApplicationService.toggleFavorite(invalidId);
        assertFalse(result.isPresent());
    }
    @Test
    @DisplayName("PASS: Toggle archive flips archived boolean flag")
    void testToggleArchive_Success() {
        mockDashboard.setArchived(false);
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(mockDashboard));
        when(dashboardRepository.save(any(DashboardEntity.class))).thenAnswer(i -> i.getArgument(0));
        Optional<DashboardResponseDto> result = dashboardApplicationService.toggleArchive(dashboardId);
        assertTrue(result.isPresent());
        assertTrue(result.get().isArchived());
    }
    @Test
    @DisplayName("FAIL/EDGE: Toggle archive on non-existing dashboard returns Optional.empty()")
    void testToggleArchive_NotFound() {
        UUID invalidId = UUID.randomUUID();
        when(dashboardRepository.findById(invalidId)).thenReturn(Optional.empty());
        Optional<DashboardResponseDto> result = dashboardApplicationService.toggleArchive(invalidId);
        assertFalse(result.isPresent());
    }
}
