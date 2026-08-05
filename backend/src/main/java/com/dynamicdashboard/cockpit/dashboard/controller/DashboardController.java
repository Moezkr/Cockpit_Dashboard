package com.dynamicdashboard.cockpit.dashboard.controller;
import com.dynamicdashboard.cockpit.dashboard.application.DashboardApplicationService;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DashboardRequestDto;
import com.dynamicdashboard.cockpit.dashboard.application.dto.DashboardResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;
@RestController
@RequestMapping("/api/dashboards")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {
    private final DashboardApplicationService dashboardApplicationService;
    @GetMapping
    public ResponseEntity<List<DashboardResponseDto>> getAllDashboards() {
        return ResponseEntity.ok(dashboardApplicationService.getAllDashboards());
    }
    @GetMapping("/{id}")
    public ResponseEntity<DashboardResponseDto> getDashboardById(@PathVariable UUID id) {
        return dashboardApplicationService.getDashboardById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping
    public ResponseEntity<DashboardResponseDto> createDashboard(@RequestBody DashboardRequestDto dto) {
        DashboardResponseDto created = dashboardApplicationService.createDashboard(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    @PutMapping("/{id}")
    public ResponseEntity<DashboardResponseDto> updateDashboard(@PathVariable UUID id, @RequestBody DashboardRequestDto dto) {
        return dashboardApplicationService.updateDashboard(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable UUID id) {
        if (dashboardApplicationService.deleteDashboard(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<DashboardResponseDto> duplicateDashboard(@PathVariable UUID id) {
        return dashboardApplicationService.duplicateDashboard(id)
                .map(res -> ResponseEntity.status(HttpStatus.CREATED).body(res))
                .orElse(ResponseEntity.notFound().build());
    }
    @PatchMapping("/{id}/favorite")
    public ResponseEntity<DashboardResponseDto> toggleFavorite(@PathVariable UUID id) {
        return dashboardApplicationService.toggleFavorite(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PatchMapping("/{id}/archive")
    public ResponseEntity<DashboardResponseDto> toggleArchive(@PathVariable UUID id) {
        return dashboardApplicationService.toggleArchive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
