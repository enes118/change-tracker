package com.cdc.changetracker.cdc.service.listener;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;
import org.postgresql.PGConnection;
import org.postgresql.replication.PGReplicationStream;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;
import java.util.function.Consumer;

@Component
public class PostgresCdcListener implements CdcListener {

    @Override
    public DbType getSupportedDbType() {
        return DbType.POSTGRESQL;
    }

    @Override
    public void startListening(CdcConfig config, Consumer<String> eventConsumer) {
        new Thread(() -> {
            try {
                String url = String.format("jdbc:postgresql://%s:%d/%s",
                        config.getDbHost(), config.getDbPort(), config.getDbName());

                Properties props = new Properties();
                props.setProperty("user", config.getDbUser());
                props.setProperty("password", config.getDbPassword());
                props.setProperty("assumeMinServerVersion", "9.4");
                props.setProperty("replication", "database");

                System.out.println(">>> PostgresCdcListener: PostgreSQL sunucusuna bağlanılıyor... <<<");

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

                    System.out.println(">>> POSTGRESQL CDC DİNLEYİCİSİ AKTİF! Olaylar Bekleniyor... <<<");

                    while (true) {
                        ByteBuffer msg = stream.readPending();
                        if (msg != null) {
                            int offset = msg.arrayOffset();
                            byte[] source = msg.array();
                            int length = source.length - offset;

                            String eventData = new String(source, offset, length);
                            System.out.println("[POSTGRES CDC EVENT YAKALANDI]: " + eventData);
                            eventConsumer.accept(eventData);

                            // LSN Geri Bildirimi (PostgreSQL'in WAL akışını ilerletmesi için ŞARTDIR)
                            stream.setAppliedLSN(stream.getLastReceiveLSN());
                            stream.setFlushedLSN(stream.getLastReceiveLSN());
                        } else {
                            Thread.sleep(50);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Postgres CDC Stream Hatası: " + e.getMessage());
            }
        }).start();
    }
}
