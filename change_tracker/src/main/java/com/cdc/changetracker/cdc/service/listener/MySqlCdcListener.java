package com.cdc.changetracker.cdc.service.listener;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;
import com.github.shyiko.mysql.binlog.BinaryLogClient;
import com.github.shyiko.mysql.binlog.event.EventData;
import com.github.shyiko.mysql.binlog.event.EventType;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

@Component
public class MySqlCdcListener implements CdcListener {

    @Override
    public DbType getSupportedDbType() {
        return DbType.MYSQL;
    }

    @Override
    public void startListening(CdcConfig config, Consumer<String> eventConsumer) {
        new Thread(() -> {
            try {
                long serverId = Long.parseLong(config.getProperty("serverId", "54001"));

                BinaryLogClient client = new BinaryLogClient(
                        config.getDbHost(),
                        config.getDbPort(),
                        config.getDbUser(),
                        config.getDbPassword()
                );
                client.setServerId(serverId);

                System.out.println(">>> MySqlCdcListener: MySQL sunucusuna bağlanılıyor... Host: " + config.getDbHost() + ":" + config.getDbPort() + " <<<");

                client.registerEventListener(event -> {
                    EventType eventType = event.getHeader().getEventType();
                    EventData data = event.getData();

                    if (data != null) {
                        String typeName = eventType.name();
                        if (typeName.contains("WRITE_ROWS") || typeName.contains("UPDATE_ROWS") || typeName.contains("DELETE_ROWS")) {
                            String eventSummary = String.format("[MYSQL CDC %s EVENT]: %s", typeName, data.toString());
                            System.out.println(eventSummary);
                            eventConsumer.accept(eventSummary);
                        }
                    }
                });

                System.out.println(">>> MYSQL CDC DİNLEYİCİSİ AKTİF! Binary Log Olayları Bekleniyor... <<<");
                client.connect();

            } catch (Exception e) {
                System.err.println("MySQL CDC Stream Hatası: " + e.getMessage());
            }
        }).start();
    }
}
