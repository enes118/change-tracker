package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.repository.CdcConfigTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CdcTemplateService {

    private final CdcConfigTemplateRepository templateRepository;

    public CdcTemplateService(CdcConfigTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public List<CdcConfigTemplate> getAllActiveTemplates() {
        return templateRepository.findByActiveTrue();
    }

    public Optional<CdcConfigTemplate> getTemplateByDbType(DbType dbType) {
        return templateRepository.findByDbTypeAndActiveTrue(dbType);
    }

    public CdcConfigTemplate saveOrUpdateTemplate(CdcConfigTemplate template) {
        return templateRepository.findByDbTypeAndActiveTrue(template.getDbType())
                .map(existing -> {
                    existing.setDescription(template.getDescription());
                    existing.setTemplateJson(template.getTemplateJson());
                    existing.setActive(template.getActive() != null ? template.getActive() : true);
                    return templateRepository.save(existing);
                })
                .orElseGet(() -> templateRepository.save(template));
    }

    public void deleteTemplate(Long id) {
        templateRepository.deleteById(id);
    }
}
