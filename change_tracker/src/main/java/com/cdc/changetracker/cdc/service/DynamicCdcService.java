package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.repository.CdcConfigRepository;
import com.cdc.changetracker.cdc.service.listener.CdcListener;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class DynamicCdcService {

    private final CdcConfigRepository configRepository;
    private final List<CdcListener> cdcListeners;
    private final List<String> capturedEvents = new CopyOnWriteArrayList<>();

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
                listener.startListening(config, capturedEvents::add);
            } catch (Exception e) {
                System.err.println("CDC Replikasyon Başlatma Hatası (" + config.getConnectionName() + "): " + e.getMessage());
            }
        }
    }

    private CdcListener findListenerForDbType(DbType dbType) {
        return cdcListeners.stream()
                .filter(l -> l.getSupportedDbType() == dbType)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, dbType + " veritabanı türü için CDC dinleyici sürücüsü henüz sisteme eklenmemiştir!"));
    }

    public List<String> getCapturedEvents() {
        return capturedEvents;
    }
}
