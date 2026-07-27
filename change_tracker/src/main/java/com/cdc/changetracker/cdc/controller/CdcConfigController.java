package com.cdc.changetracker.cdc.controller;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.service.CdcConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cdc/configs")
public class CdcConfigController {

    private final CdcConfigService configService;

    public CdcConfigController(CdcConfigService configService) {
        this.configService = configService;
    }

    @PostMapping
    public ResponseEntity<CdcConfig> createConfig(@RequestBody CdcConfig config) {
        return ResponseEntity.ok(configService.createConfig(config));
    }

    @GetMapping
    public ResponseEntity<List<CdcConfig>> getAllConfigs() {
        return ResponseEntity.ok(configService.getAllConfigs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CdcConfig> getConfigById(@PathVariable Long id) {
        return configService.getConfigById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CdcConfig> updateConfig(@PathVariable Long id, @RequestBody CdcConfig config) {
        return ResponseEntity.ok(configService.updateConfig(id, config));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        configService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CdcConfig> toggleConfigStatus(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(configService.toggleConfigStatus(id, active));
    }
}
