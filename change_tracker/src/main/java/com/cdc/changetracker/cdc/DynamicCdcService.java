package com.cdc.changetracker.cdc;

import org.postgresql.PGConnection;
import org.postgresql.replication.PGReplicationStream;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.nio.ByteBuffer;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class DynamicCdcService {

    private final CdcConfigRepository configRepository;
    private final List<String> capturedEvents = new CopyOnWriteArrayList<>();

    public DynamicCdcService(CdcConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    // Uygulama tamamen ayağa kalktığında bu metot OTOMATİK çalışır
    @EventListener(ApplicationReadyEvent.class)
    public void startDynamicReplication() {
        new Thread(() -> {
            try {
                CdcConfig config = configRepository.findFirstByActiveTrue()
                        .orElseThrow(() -> new RuntimeException("Aktif bir CDC konfigürasyonu bulunamadı!"));

                String url = String.format("jdbc:postgresql://%s:%d/%s",
                        config.getDbHost(), config.getDbPort(), config.getDbName());

                Properties props = new Properties();
                props.setProperty("user", config.getDbUser());
                props.setProperty("password", config.getDbPassword());
                props.setProperty("assumeMinServerVersion", "9.4");
                props.setProperty("replication", "database");

                System.out.println(">>> DynamicCdcService: Veritabanına bağlanılıyor... <<<");

                try (Connection conn = DriverManager.getConnection(url, props)) {
                    PGConnection pgConnection = conn.unwrap(PGConnection.class);

                    PGReplicationStream stream = pgConnection.getReplicationAPI()
                            .replicationStream()
                            .logical()
                            .withSlotName(config.getSlotName())
                            .start();

                    System.out.println(">>> CDC DİNLEYİCİSİ AKTİF! PostgreSQL Değişiklikleri Bekleniyor... <<<");

                    while (true) {
                        // stream.read() veritabanından yeni paket geldikçe tetiklenir
                        ByteBuffer msg = stream.read();
                        if (msg != null) {
                            int offset = msg.arrayOffset();
                            byte[] source = msg.array();
                            int length = source.length - offset;

                            String eventData = new String(source, offset, length);
                            System.out.println("[CDC EVENT YAKALANDI]: " + eventData);
                            capturedEvents.add(eventData);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("CDC Stream Hatası: " + e.getMessage());
            }
        }).start();
    }

    public List<String> getCapturedEvents() {
        return capturedEvents;
    }
}