package com.cdc.changetracker.cdc.controller;

import com.cdc.changetracker.cdc.dto.CdcOperationStatsDto;
import com.cdc.changetracker.cdc.dto.CdcChangeEventResponseDto;
import com.cdc.changetracker.cdc.service.DynamicCdcService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cdc")
@RequiredArgsConstructor
public class CdcController {

    private final DynamicCdcService cdcService;

    @PostMapping("/listeners/{configId}/start")
    public ResponseEntity<String> startListener(@PathVariable Long configId) {
        cdcService.startListener(configId);
        return ResponseEntity.ok("Config ID " + configId + " için CDC dinleyicisi başlatıldı!");
    }

    @PostMapping("/listeners/{configId}/stop")
    public ResponseEntity<String> stopListener(@PathVariable Long configId) {
        cdcService.stopListener(configId);
        return ResponseEntity.ok("Config ID " + configId + " için CDC dinleyicisi durduruldu!");
    }

    @GetMapping("/listeners/status")
    public ResponseEntity<Map<String, String>> getListenersStatus() {
        return ResponseEntity.ok(cdcService.getListenersStatus());
    }

    @GetMapping("/events")
    public ResponseEntity<List<CdcChangeEventResponseDto>> getEvents() {
        return ResponseEntity.ok(cdcService.getCapturedEvents());
    }

    @GetMapping("/events/config/{configId}")
    public ResponseEntity<List<CdcChangeEventResponseDto>> getEventsByConfigId(@PathVariable Long configId) {
        return ResponseEntity.ok(cdcService.getCapturedEventsByConfigId(configId));
    }

    @GetMapping("/events/latest-event")
    public ResponseEntity<List<CdcChangeEventResponseDto>> getRecentEvents() {
        return ResponseEntity.ok(cdcService.getRecentEvents());
    }

    @GetMapping("/events/stats/daily")
    public ResponseEntity<CdcOperationStatsDto> getDailyStats() {
        return ResponseEntity.ok(cdcService.getDailyOperationStats());
    }

    @GetMapping("/events/stats/monthly")
    public ResponseEntity<CdcOperationStatsDto> getMonthlyStats() {
        return ResponseEntity.ok(cdcService.getMonthlyOperationStats());
    }
}
