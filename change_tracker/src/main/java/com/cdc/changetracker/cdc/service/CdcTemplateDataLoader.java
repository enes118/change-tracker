package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.repository.CdcConfigTemplateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CdcTemplateDataLoader implements CommandLineRunner {

    private final CdcConfigTemplateRepository templateRepository;

    public CdcTemplateDataLoader(CdcConfigTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Override
    public void run(String... args) {
        if (templateRepository.count() == 0) {
            System.out.println(">>> CDC Şablon Tablosu Boş. Varsayılan Şablonlar Veritabanına Yükleniyor... <<<");

            templateRepository.save(new CdcConfigTemplate(
                    DbType.POSTGRESQL,
                    "PostgreSQL Logical Replication Varsayılan Şablonu",
                    "{\"slotName\":\"cdc_pg_slot\",\"pluginName\":\"pgoutput\",\"publicationName\":\"dbz_publication\"}"
            ));

            templateRepository.save(new CdcConfigTemplate(
                    DbType.MYSQL,
                    "MySQL Binary Log (Binlog) Varsayılan Şablonu",
                    "{\"serverId\":\"54001\",\"binlogFilename\":\"\",\"binlogPosition\":\"0\",\"gtidSet\":\"\"}"
            ));

            templateRepository.save(new CdcConfigTemplate(
                    DbType.SQLSERVER,
                    "SQL Server Change Tracking / CDC Varsayılan Şablonu",
                    "{\"databaseHistory\":\"io.debezium.relational.history.FileDatabaseHistory\",\"databaseHistoryFileFilename\":\"/tmp/dbhistory.dat\"}"
            ));

            templateRepository.save(new CdcConfigTemplate(
                    DbType.ORACLE,
                    "Oracle LogMiner / XStream Varsayılan Şablonu",
                    "{\"pdbName\":\"ORCLPDB1\",\"outServerName\":\"dbzxout\"}"
            ));

            System.out.println(">>> CDC Varsayılan Şablonları Veritabanına Başarıyla Kaydedildi! <<<");
        }
    }
}
