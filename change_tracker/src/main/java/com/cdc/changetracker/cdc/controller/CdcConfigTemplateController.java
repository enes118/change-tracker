package com.cdc.changetracker.cdc.controller;

import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.service.CdcTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cdc/templates")
public class CdcConfigTemplateController {

    private final CdcTemplateService templateService;

    public CdcConfigTemplateController(CdcTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<Map<DbType, Map<String, String>>> getAllTemplates() {
        Map<DbType, Map<String, String>> templates = templateService.getAllActiveTemplates().stream()
                .collect(Collectors.toMap(
                        CdcConfigTemplate::getDbType,
                        CdcConfigTemplate::getTemplateMap
                ));
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/details")
    public ResponseEntity<List<CdcConfigTemplate>> getAllTemplateDetails() {
        return ResponseEntity.ok(templateService.getAllActiveTemplates());
    }

    @GetMapping("/{dbType}")
    public ResponseEntity<Map<String, String>> getTemplateByDbType(@PathVariable DbType dbType) {
        return templateService.getTemplateByDbType(dbType)
                .map(template -> ResponseEntity.ok(template.getTemplateMap()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CdcConfigTemplate> createOrUpdateTemplate(@RequestBody CdcConfigTemplate template) {
        return ResponseEntity.ok(templateService.saveOrUpdateTemplate(template));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
