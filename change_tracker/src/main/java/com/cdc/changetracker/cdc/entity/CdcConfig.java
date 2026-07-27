package com.cdc.changetracker.cdc.entity;

import com.cdc.changetracker.cdc.enums.DbType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "cdc_connection_config")
@Data
public class CdcConfig {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String connectionName;

    @Enumerated(EnumType.STRING)
    private DbType dbType;

    private String dbHost;
    private Integer dbPort;
    private String dbName;
    private String dbUser;
    private String dbPassword;

    private String tableIncludeList;

    @Column(columnDefinition = "TEXT")
    private String additionalPropertiesJson;

    private Boolean active;

    public Map<String, String> getAdditionalProperties() {
        if (additionalPropertiesJson == null || additionalPropertiesJson.isBlank()) {
            return new HashMap<>();
        }
        try {
            return OBJECT_MAPPER.readValue(additionalPropertiesJson, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void setAdditionalProperties(Map<String, String> properties) {
        try {
            this.additionalPropertiesJson = OBJECT_MAPPER.writeValueAsString(properties);
        } catch (Exception e) {
            this.additionalPropertiesJson = "{}";
        }
    }

    public String getProperty(String key, String defaultValue) {
        return getAdditionalProperties().getOrDefault(key, defaultValue);
    }
}
