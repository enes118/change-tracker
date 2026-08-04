package com.cdc.changetracker.cdc.service.listener;

import com.cdc.changetracker.cdc.entity.CdcChangeEvent;
import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.repository.CdcChangeEventRepository;
import lombok.RequiredArgsConstructor;
import org.postgresql.PGConnection;
import org.postgresql.replication.PGReplicationStream;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.sql.Connection;
import java.sql.DriverManager;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class PostgresCdcListener implements CdcListener {

    private final CdcChangeEventRepository eventRepository;
    private final Map<Long, Boolean> activeListeners = new ConcurrentHashMap<>();

    @Override
    public DbType getSupportedDbType() {
        return DbType.POSTGRESQL;
    }

    @Override
    public boolean isRunning(Long configId) {
        return activeListeners.getOrDefault(configId, false);
    }

    @Override
    public void stopListening(Long configId) {
        if (activeListeners.containsKey(configId)) {
            activeListeners.put(configId, false);
            System.out.println(">>> PostgresCdcListener: Config ID " + configId + " için dinleyici durdurma sinyali gönderildi. <<<");
        }
    }

    @Override
    public void startListening(CdcConfig config) {
        Long configId = config.getId();
        if (isRunning(configId)) {
            System.out.println(">>> PostgresCdcListener: Config ID " + configId + " zaten aktif çalışıyor! <<<");
            return;
        }

        activeListeners.put(configId, true);

        new Thread(() -> {
            try {
                String url = String.format("jdbc:postgresql://%s:%d/%s",
                        config.getDbHost(), config.getDbPort(), config.getDbName());

                Properties props = new Properties();
                props.setProperty("user", config.getDbUser());
                props.setProperty("password", config.getDbPassword());
                props.setProperty("assumeMinServerVersion", "9.4");
                props.setProperty("replication", "database");

                System.out.println(">>> PostgresCdcListener: PostgreSQL sunucusuna bağlanılıyor... Config ID: " + configId + " <<<");

                try (Connection conn = DriverManager.getConnection(url, props)) {
                    PGConnection pgConnection = conn.unwrap(PGConnection.class);

                    String slotName = config.getProperty("slotName", "cdc_slot");

                    // Slot yoksa otomatik oluştur
                    try {
                        pgConnection.getReplicationAPI()
                                .createReplicationSlot()
                                .logical()
                                .withSlotName(slotName)
                                .withOutputPlugin("test_decoding")
                                .make();
                        System.out.println(">>> Replikasyon slotu otomatik oluşturuldu: " + slotName + " <<<");
                    } catch (Exception ignored) {
                        // Slot zaten varsa hata verir, yutulur
                    }

                    PGReplicationStream stream = pgConnection.getReplicationAPI()
                            .replicationStream()
                            .logical()
                            .withSlotName(slotName)
                            .withSlotOption("include-xids", "true")
                            .withSlotOption("skip-empty-xacts", "true")
                            .start();

                    System.out.println(">>> POSTGRESQL CDC DİNLEYİCİSİ AKTİF! (Config ID: " + configId + ") Olaylar Bekleniyor... <<<");

                    while (Boolean.TRUE.equals(activeListeners.get(configId))) {
                        ByteBuffer msg = stream.readPending();
                        if (msg != null) {
                            int offset = msg.arrayOffset();
                            byte[] source = msg.array();
                            int length = source.length - offset;

                            String eventData = new String(source, offset, length);

                            // KONTROL: Sistem içi tarihçe/konfigürasyon tabloları ve boş BEGIN/COMMIT loglarını filtrele
                            boolean isIgnored = eventData.contains("cdc_change_event")
                                    || eventData.contains("cdc_connection_config")
                                    || eventData.contains("cdc_config_template")
                                    || eventData.startsWith("BEGIN")
                                    || eventData.startsWith("COMMIT");

                            if (!isIgnored) {
                                System.out.println("[POSTGRES CDC EVENT YAKALANDI]: " + eventData);
                                saveChangeEvent(config, eventData);
                            }

                            // LSN Geri Bildirimi
                            stream.setAppliedLSN(stream.getLastReceiveLSN());
                            stream.setFlushedLSN(stream.getLastReceiveLSN());
                        } else {
                            Thread.sleep(50);
                        }
                    }
                    System.out.println(">>> POSTGRESQL CDC DİNLEYİCİSİ KAPATILDI! (Config ID: " + configId + ") <<<");
                }
            } catch (Exception e) {
                System.err.println("Postgres CDC Stream Hatası: " + e.getMessage());
            } finally {
                activeListeners.remove(configId);
            }
        }).start();
    }

    private void saveChangeEvent(CdcConfig config, String rawLogData) {
        String eventType = "UNKNOWN";
        if (rawLogData.contains("INSERT")) {
            eventType = "INSERT";
        } else if (rawLogData.contains("UPDATE")) {
            eventType = "UPDATE";
        } else if (rawLogData.contains("DELETE")) {
            eventType = "DELETE";
        }

        String oldData = null;
        String newData = null;

        if ("DELETE".equals(eventType)) {
            oldData = rawLogData;
        } else {
            newData = rawLogData;
        }

        CdcChangeEvent event = CdcChangeEvent.builder()
                .cdcConfig(config)
                .connectionName(config.getConnectionName())
                .dbType(config.getDbType())
                .dbName(config.getDbName())
                .tableName(config.getTableIncludeList() != null ? config.getTableIncludeList() : "all")
                .eventType(eventType)
                .oldDataJson(oldData)
                .newDataJson(newData)
                .createdDate(LocalDateTime.now())
                .build();

        eventRepository.save(event);
    }
}
