package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.dto.CdcChangeEventResponseDto;
import com.cdc.changetracker.cdc.entity.CdcChangeEvent;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DynamicCdcService {

    private final CdcConfigRepository configRepository;
    private final CdcChangeEventRepository eventRepository;
    private final CdcListener cdcListenerManager;
    private final List<CdcListener> cdcListeners;
    private final CdcMapper cdcMapper;

    @EventListener(ApplicationReadyEvent.class)
    public void startDynamicReplication() {
        List<CdcConfig> activeConfigs = configRepository.findAllByActiveTrue();
        if (activeConfigs.isEmpty()) {
            System.out.println(">>> UYARI: Aktif bir CDC konfigürasyonu bulunamadı. Replikasyon başlatılmadı. <<<");
            return;
        }

        System.out.println(">>> " + activeConfigs.size() + " adet aktif veritabanı konfigürasyonu için CDC dinleyicileri başlatılıyor... <<<");

        for (CdcConfig config : activeConfigs) {
            if (config.getDbType() == null) {
                System.err.println(">>> UYARI: Konfigürasyonun (ID: " + config.getId() + ") dbType alanı NULL! Pas geçiliyor... <<<");
                continue;
            }

            try {
                CdcListener listener = findListenerForDbType(config.getDbType());
                listener.startListening(config, rawLogData -> saveChangeEvent(config, rawLogData));
            } catch (Exception e) {
                System.err.println("CDC Replikasyon Başlatma Hatası (" + config.getConnectionName() + "): " + e.getMessage());
            }
        }
    }

    public void saveChangeEvent(CdcConfig config, String rawLogData) {
        String eventType = "UNKNOWN";
        if (rawLogData.contains("INSERT") || rawLogData.contains("WRITE_ROWS")) {
            eventType = "INSERT";
        } else if (rawLogData.contains("UPDATE") || rawLogData.contains("UPDATE_ROWS")) {
            eventType = "UPDATE";
        } else if (rawLogData.contains("DELETE") || rawLogData.contains("DELETE_ROWS")) {
            eventType = "DELETE";
        }

        CdcChangeEvent event = CdcChangeEvent.builder()
                .connectionName(config.getConnectionName())
                .dbType(config.getDbType())
                .dbName(config.getDbName())
                .tableName(config.getTableIncludeList() != null ? config.getTableIncludeList() : "all")
                .eventType(eventType)
                .newDataJson(rawLogData)
                .createdDate(LocalDateTime.now())
                .build();

        eventRepository.save(event);
    }

    private CdcListener findListenerForDbType(DbType dbType) {
        return cdcListeners.stream()
                .filter(l -> l.getSupportedDbType() == dbType)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, dbType + " veritabanı türü için CDC dinleyici sürücüsü henüz sisteme eklenmemiştir!"));
    }

    public List<CdcChangeEventResponseDto> getCapturedEvents() {
        return eventRepository.findTop100ByOrderByIdDesc().stream()
                .map(cdcMapper::toDto)
                .toList();
    }
}
