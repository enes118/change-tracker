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
            startListenerForConfig(config);
        }
    }

    public void startListener(Long configId) {
        CdcConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konfigürasyon bulunamadı ID: " + configId));

        startListenerForConfig(config);
    }

    public void stopListener(Long configId) {
        CdcConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Konfigürasyon bulunamadı ID: " + configId));

        CdcListener listener = findListenerForDbType(config.getDbType());
        listener.stopListening(configId);
    }

    private void startListenerForConfig(CdcConfig config) {
        if (config.getDbType() == null) {
            System.err.println(">>> UYARI: Konfigürasyonun (ID: " + config.getId() + ") dbType alanı NULL! Pas geçiliyor... <<<");
            return;
        }

        try {
            CdcListener listener = findListenerForDbType(config.getDbType());
            listener.startListening(config);
        } catch (Exception e) {
            System.err.println("CDC Replikasyon Başlatma Hatası (" + config.getConnectionName() + "): " + e.getMessage());
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
        return eventRepository.findTop100ByOrderByIdDesc().stream()
                .map(cdcMapper::toDto)
                .toList();
    }
}
