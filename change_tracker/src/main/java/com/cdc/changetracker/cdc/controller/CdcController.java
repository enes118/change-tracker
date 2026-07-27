package com.cdc.changetracker.cdc.controller;

import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.repository.CdcConfigTemplateRepository;
import com.cdc.changetracker.cdc.service.DynamicCdcService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cdc")
public class CdcController {

    private final DynamicCdcService cdcService;
    private final CdcConfigTemplateRepository templateRepository;

    public CdcController(DynamicCdcService cdcService, CdcConfigTemplateRepository templateRepository) {
        this.cdcService = cdcService;
        this.templateRepository = templateRepository;
    }

    @GetMapping("/start")
    public String startCdc() {
        cdcService.startDynamicReplication();
        return "CDC Dinlemesi Arka Planda Başlatıldı!";
    }

    @GetMapping("/events")
    public List<String> getEvents() {
        return cdcService.getCapturedEvents();
    }

    @GetMapping("/templates")
    public Map<DbType, Map<String, String>> getAllTemplates() {
        return templateRepository.findByActiveTrue().stream()
                .collect(Collectors.toMap(
                        CdcConfigTemplate::getDbType,
                        CdcConfigTemplate::getTemplateMap
                ));
    }

    @GetMapping("/templates/{dbType}")
    public ResponseEntity<Map<String, String>> getTemplateByDbType(@PathVariable DbType dbType) {
        return templateRepository.findByDbTypeAndActiveTrue(dbType)
                .map(template -> ResponseEntity.ok(template.getTemplateMap()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/templates")
    public ResponseEntity<CdcConfigTemplate> createOrUpdateTemplate(@RequestBody CdcConfigTemplate newTemplate) {
        CdcConfigTemplate saved = templateRepository.findByDbTypeAndActiveTrue(newTemplate.getDbType())
                .map(existing -> {
                    existing.setDescription(newTemplate.getDescription());
                    existing.setTemplateJson(newTemplate.getTemplateJson());
                    existing.setActive(newTemplate.getActive() != null ? newTemplate.getActive() : true);
                    return templateRepository.save(existing);
                })
                .orElseGet(() -> templateRepository.save(newTemplate));

        return ResponseEntity.ok(saved);
    }
}
