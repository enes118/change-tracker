package com.cdc.changetracker.cdc.service.listener;

import com.cdc.changetracker.cdc.entity.CdcChangeEvent;
import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.repository.CdcChangeEventRepository;
import com.github.shyiko.mysql.binlog.BinaryLogClient;
import com.github.shyiko.mysql.binlog.event.EventData;
import com.github.shyiko.mysql.binlog.event.EventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class MySqlCdcListener implements CdcListener {

    private final CdcChangeEventRepository eventRepository;

    @Override
    public DbType getSupportedDbType() {
        return DbType.MYSQL;
    }

    @Override
    public void startListening(CdcConfig config) {
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

                            boolean isInternalTable = eventSummary.contains("cdc_change_event")
                                    || eventSummary.contains("cdc_connection_config")
                                    || eventSummary.contains("cdc_config_template");

                            if (!isInternalTable) {
                                System.out.println(eventSummary);
                                saveChangeEvent(config, typeName, eventSummary);
                            }
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

    private void saveChangeEvent(CdcConfig config, String typeName, String rawLogData) {
        String eventType = "UNKNOWN";
        if (typeName.contains("WRITE_ROWS")) {
            eventType = "INSERT";
        } else if (typeName.contains("UPDATE_ROWS")) {
            eventType = "UPDATE";
        } else if (typeName.contains("DELETE_ROWS")) {
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
