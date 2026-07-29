package com.dynamicdashboard.cockpit.catalog.controller;

import com.dynamicdashboard.cockpit.catalog.application.CatalogApplicationService;
import com.dynamicdashboard.cockpit.catalog.application.dto.DataFieldDto;
import com.dynamicdashboard.cockpit.catalog.application.dto.DataSourceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CatalogController {

    private final CatalogApplicationService catalogApplicationService;

    @GetMapping("/data-sources")
    public ResponseEntity<List<DataSourceDto>> getAllDataSources() {
        return ResponseEntity.ok(catalogApplicationService.getAllDataSources());
    }

    @GetMapping("/data-sources/{id}")
    public ResponseEntity<DataSourceDto> getDataSourceById(@PathVariable UUID id) {
        return catalogApplicationService.getDataSourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/data-sources/{id}/fields")
    public ResponseEntity<List<DataFieldDto>> getFieldsByDataSourceId(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogApplicationService.getFieldsByDataSourceId(id));
    }
}
