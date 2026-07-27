package com.cdc.changetracker.cdc.entity;

import com.cdc.changetracker.cdc.enums.DbType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "cdc_config_template")
@Data
@NoArgsConstructor
public class CdcConfigTemplate {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private DbType dbType;

    private String description;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String templateJson;

    private Boolean active = true;

    public CdcConfigTemplate(DbType dbType, String description, String templateJson) {
        this.dbType = dbType;
        this.description = description;
        this.templateJson = templateJson;
        this.active = true;
    }

    public Map<String, String> getTemplateMap() {
        if (templateJson == null || templateJson.isBlank()) {
            return new HashMap<>();
        }
        try {
            return OBJECT_MAPPER.readValue(templateJson, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void setTemplateMap(Map<String, String> map) {
        try {
            this.templateJson = OBJECT_MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            this.templateJson = "{}";
        }
    }
}
