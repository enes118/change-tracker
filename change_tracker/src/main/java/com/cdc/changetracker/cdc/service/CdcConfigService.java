package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.repository.CdcConfigRepository;
import com.cdc.changetracker.cdc.repository.CdcConfigTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CdcConfigService {

    private final CdcConfigRepository configRepository;
    private final CdcConfigTemplateRepository templateRepository;

    public CdcConfigService(CdcConfigRepository configRepository, CdcConfigTemplateRepository templateRepository) {
        this.configRepository = configRepository;
        this.templateRepository = templateRepository;
    }

    public CdcConfig createConfig(CdcConfig config) {
        if (config.getAdditionalPropertiesJson() == null || config.getAdditionalPropertiesJson().isBlank()) {
            Optional<CdcConfigTemplate> templateOpt = templateRepository.findByDbTypeAndActiveTrue(config.getDbType());
            if (templateOpt.isPresent()) {
                config.setAdditionalPropertiesJson(templateOpt.get().getTemplateJson());
            } else {
                config.setAdditionalPropertiesJson("{}");
            }
        }
        if (config.getActive() == null) {
            config.setActive(true);
        }
        return configRepository.save(config);
    }

    public List<CdcConfig> getAllConfigs() {
        return configRepository.findAll();
    }

    public Optional<CdcConfig> getConfigById(Long id) {
        return configRepository.findById(id);
    }

    public CdcConfig updateConfig(Long id, CdcConfig updatedConfig) {
        return configRepository.findById(id)
                .map(existing -> {
                    existing.setConnectionName(updatedConfig.getConnectionName());
                    existing.setDbType(updatedConfig.getDbType());
                    existing.setDbHost(updatedConfig.getDbHost());
                    existing.setDbPort(updatedConfig.getDbPort());
                    existing.setDbName(updatedConfig.getDbName());
                    existing.setDbUser(updatedConfig.getDbUser());
                    existing.setDbPassword(updatedConfig.getDbPassword());
                    existing.setTableIncludeList(updatedConfig.getTableIncludeList());
                    if (updatedConfig.getAdditionalPropertiesJson() != null) {
                        existing.setAdditionalPropertiesJson(updatedConfig.getAdditionalPropertiesJson());
                    }
                    if (updatedConfig.getActive() != null) {
                        existing.setActive(updatedConfig.getActive());
                    }
                    return configRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("CdcConfig bulunamadı! ID: " + id));
    }

    public void deleteConfig(Long id) {
        configRepository.deleteById(id);
    }

    public CdcConfig toggleConfigStatus(Long id, boolean active) {
        return configRepository.findById(id)
                .map(existing -> {
                    existing.setActive(active);
                    return configRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("CdcConfig bulunamadı! ID: " + id));
    }
}
