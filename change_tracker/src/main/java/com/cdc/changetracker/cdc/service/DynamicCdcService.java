package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.dto.CdcChangeEventResponseDto;
import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.mapper.CdcMapper;
import com.cdc.changetracker.cdc.repository.CdcChangeEventRepository;
import com.cdc.changetracker.cdc.repository.CdcConfigRepository;
import com.cdc.changetracker.cdc.service.listener.CdcListener;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cdc.changetracker.cdc.dto.CdcOperationStatsDto;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DynamicCdcService {

    private final CdcConfigRepository configRepository;
    private final CdcChangeEventRepository eventRepository;
    private final List<CdcListener> cdcListeners;
    private final CdcMapper cdcMapper;

    @EventListener(ApplicationReadyEvent.class)
    public void startDynamicReplicationOnStartup() {
        List<CdcConfig> activeConfigs = configRepository.findAllByActiveTrue();
        if (activeConfigs.isEmpty()) {
            System.out.println(">>> UYARI: Aktif bir CDC konfigürasyonu bulunamadı. Replikasyon başlatılmadı. <<<");
            return;
        }

        System.out.println(">>> " + activeConfigs.size() + " adet aktif veritabanı konfigürasyonu için CDC dinleyicileri başlatılıyor... <<<");

        for (CdcConfig config : activeConfigs) {
            startListener(config);
        }
    }

    public void startListener(Long configId) {
        CdcConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konfigürasyon bulunamadı ID: " + configId));

        startListener(config);
    }

    public void startListener(CdcConfig config) {
        if (config == null || config.getDbType() == null) {
            System.err.println(">>> UYARI: Konfigürasyon veya dbType alanı NULL! Pas geçiliyor... <<<");
            return;
        }

        try {
            CdcListener listener = findListenerForDbType(config.getDbType());
            listener.startListening(config);
        } catch (Exception e) {
            System.err.println("CDC Replikasyon Başlatma Hatası (" + config.getConnectionName() + "): " + e.getMessage());
        }
    }

    public void stopListener(Long configId) {
        if (configId == null) {
            return;
        }
        for (CdcListener listener : cdcListeners) {
            listener.stopListening(configId);
        }
    }

    public Map<String, String> getListenersStatus() {
        List<CdcConfig> allConfigs = configRepository.findAll();
        Map<String, String> statusMap = new HashMap<>();

        for (CdcConfig config : allConfigs) {
            if (config.getDbType() != null) {
                CdcListener listener = findListenerForDbType(config.getDbType());
                boolean running = listener.isRunning(config.getId());
                statusMap.put("Config ID " + config.getId() + " (" + config.getConnectionName() + ")", running ? "RUNNING" : "STOPPED");
            }
        }
        return statusMap;
    }

    private CdcListener findListenerForDbType(DbType dbType) {
        return cdcListeners.stream()
                .filter(l -> l.getSupportedDbType() == dbType)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, dbType + " veritabanı türü için CDC dinleyici sürücüsü henüz sisteme eklenmemiştir!"));
    }

    public List<CdcChangeEventResponseDto> getCapturedEvents() {
        return eventRepository.findAllByOrderByIdDesc().stream()
                .map(cdcMapper::toDto)
                .toList();
    }

    public List<CdcChangeEventResponseDto> getCapturedEventsByConfigId(Long configId) {
        return eventRepository.findByCdcConfigIdOrderByIdDesc(configId).stream()
                .map(cdcMapper::toDto)
                .toList();
    }

    public List<CdcChangeEventResponseDto> getRecentEvents() {
        return eventRepository.findTop5ByOrderByIdDesc().stream()
                .map(cdcMapper::toDto)
                .toList();
    }

    public CdcOperationStatsDto getDailyOperationStats() {
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        return calculateStatsSince(startOfDay);
    }

    public CdcOperationStatsDto getMonthlyOperationStats() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);
        return calculateStatsSince(startOfMonth);
    }

    private CdcOperationStatsDto calculateStatsSince(LocalDateTime since) {
        List<Object[]> results = eventRepository.countEventsByEventTypeSince(since);
        long insertCount = 0;
        long updateCount = 0;
        long deleteCount = 0;

        for (Object[] row : results) {
            String eventType = (row[0] != null) ? row[0].toString().toUpperCase() : "";
            long count = (row[1] != null) ? ((Number) row[1]).longValue() : 0L;

            if ("INSERT".equals(eventType)) insertCount = count;
            else if ("UPDATE".equals(eventType)) updateCount = count;
            else if ("DELETE".equals(eventType)) deleteCount = count;
        }

        long totalCount = insertCount + updateCount + deleteCount;
        return CdcOperationStatsDto.builder()
                .insertCount(insertCount)
                .updateCount(updateCount)
                .deleteCount(deleteCount)
                .totalCount(totalCount)
                .build();
    }
}
