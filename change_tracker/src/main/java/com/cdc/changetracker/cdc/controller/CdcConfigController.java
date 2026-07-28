package com.cdc.changetracker.cdc.controller;

import com.cdc.changetracker.cdc.dto.CdcConfigRequestDto;
import com.cdc.changetracker.cdc.dto.CdcConfigResponseDto;
import com.cdc.changetracker.cdc.service.CdcConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cdc/configs")
@RequiredArgsConstructor
public class CdcConfigController {

    private final CdcConfigService configService;

    @PostMapping
    public ResponseEntity<CdcConfigResponseDto> createConfig(@RequestBody CdcConfigRequestDto requestDto) {
        return ResponseEntity.ok(configService.createConfig(requestDto));
    }

    @GetMapping
    public ResponseEntity<List<CdcConfigResponseDto>> getAllConfigs() {
        return ResponseEntity.ok(configService.getAllConfigs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CdcConfigResponseDto> getConfigById(@PathVariable Long id) {
        return ResponseEntity.ok(configService.getConfigById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CdcConfigResponseDto> updateConfig(@PathVariable Long id, @RequestBody CdcConfigRequestDto requestDto) {
        return ResponseEntity.ok(configService.updateConfig(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        configService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CdcConfigResponseDto> toggleConfigStatus(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(configService.toggleConfigStatus(id, active));
    }
}
