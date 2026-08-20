package com.cdc.changetracker.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Configuration
@RequiredArgsConstructor
public class DatabaseInitializer {

    private final DataSource dataSource;

    @PostConstruct
    public void initDatabaseSchema() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);");
            stmt.execute("ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS created_date TIMESTAMP;");
            stmt.execute("ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);");
            stmt.execute("ALTER TABLE cdc_connection_config ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP;");

            System.out.println(">>> VERİTABANI ŞEMASI OTOMATİK GÜNCELLENDİ: cdc_connection_config tablosuna Audit sütunları eklendi. <<<");
        } catch (Exception e) {
            System.err.println("Şema otomatik güncelleme uyarısı: " + e.getMessage());
        }
    }
}
