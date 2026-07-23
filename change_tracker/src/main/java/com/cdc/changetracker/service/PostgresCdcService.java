package com.cdc.changetracker.cdc;

import jakarta.annotation.PostConstruct;
import org.postgresql.PGConnection;
import org.postgresql.PGProperty;
import org.postgresql.replication.PGReplicationStream;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.nio.ByteBuffer;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;


@Service
public class PostgresCdcService {
    private final SimpMessagingTemplate messagingTemplate;

    public PostgresCdcService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    private static final String URL = "jdbc:postgresql://localhost:5432/cdc_test";
    private static final String USER = "root";
    private static final String PASSWORD = "password";
    private static final String SLOT_NAME = "cdc_slot";

    @PostConstruct
    public void startReplication() {
        // Spring Boot'un açılışını kilitlem
        // xemek için dinleme işlemini ayrı bir thread (iş parçacığı) içinde başlatıyoruz.
        new Thread(() -> {
            try {
                Properties props = new Properties();
                PGProperty.USER.set(props, USER);
                PGProperty.PASSWORD.set(props, PASSWORD);
                PGProperty.ASSUME_MIN_SERVER_VERSION.set(props, "9.4");
                // Standart bağlantı değil, replikasyon bağlantısı açtığımızı belirtiyoruz
                PGProperty.REPLICATION.set(props, "database");
                PGProperty.PREFER_QUERY_MODE.set(props, "simple");

                Connection conn = DriverManager.getConnection(URL, props);
                PGConnection replConnection = conn.unwrap(PGConnection.class);

                // Slot oluşturma (test_decoding plugini WAL verisini bizim için okunabilir metne çevirir)
                try {
                    replConnection.getReplicationAPI()
                            .createReplicationSlot()
                            .logical()
                            .withSlotName(SLOT_NAME)
                            .withOutputPlugin("test_decoding")
                            .make();
                    System.out.println("Yeni Replikasyon Slotu Oluşturuldu: " + SLOT_NAME);
                } catch (Exception e) {
                    System.out.println("Slot oluşturma işlemi atlandı veya hata verdi.");
                }

                // Logları dinlemeye başla
                PGReplicationStream stream = replConnection.getReplicationAPI()
                        .replicationStream()
                        .logical()
                        .withSlotName(SLOT_NAME)
                        .withSlotOption("include-xids", false)
                        .withSlotOption("include-timestamp", false)
                        .start();

                System.out.println("PostgreSQL CDC Dinleniyor... Değişiklikler bekleniyor.");

                // Sonsuz döngü ile gelen değişiklikleri yakala
                while (true) {
                    ByteBuffer msg = stream.readPending();

                    if (msg == null) {
                        Thread.sleep(10L); // Yeni log yoksa işlemciyi yormamak için 10 milisaniye uyu
                        continue;
                    }

                    int offset = msg.arrayOffset();
                    byte[] source = msg.array();
                    int length = source.length - offset;

                    // Gelen değişikliği konsola yazdır
                    String changeLog = new String(source, offset, length);

// Sadece tablo değişikliklerini yakala (BEGIN ve COMMIT satırlarını atla)
                    if (changeLog.startsWith("table ")) {

                        // Metni ":" karakterine göre en fazla 3 parçaya bölüyoruz
                        // Örnek: "table public.employees: INSERT: id[integer]:1..."
                        String[] parts = changeLog.split(":", 3);

                        if (parts.length >= 3) {
                            // "table public.employees" kısmından sadece "employees" kelimesini al
                            String tableName = parts[0].replace("table public.", "").trim();

                            // İşlem türünü al (INSERT, UPDATE, DELETE)
                            String operation = parts[1].trim();

                            // Değişen asıl veriyi al
                            String data = parts[2].trim();

                            // Ham metni artık yapısal bir Java nesnesine dönüştürdük
                            ChangeEvent event = new ChangeEvent(tableName, operation, data);

                            System.out.println("-------------------------------------------------");
                            System.out.println("TABLO : " + event.tableName());
                            System.out.println("İŞLEM : " + event.operationType());
                            System.out.println("VERİ  : " + event.rawData());
                            System.out.println("-------------------------------------------------");
                            messagingTemplate.convertAndSend("/topic/changes", event); // WebSocket üzerinden frontend'e gönder
                        }
                    }

                    // Logu başarıyla işlediğimizi PostgreSQL'e bildiriyoruz ki eski WAL dosyalarını silebilsin
                    stream.setAppliedLSN(stream.getLastReceiveLSN());
                    stream.setFlushedLSN(stream.getLastReceiveLSN());
                }

            } catch (Exception e) {
                System.err.println("CDC Dinleme Hatası: " + e.getMessage());
            }
        }).start();
    }
}
