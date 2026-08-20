package com.cdc.changetracker.cdc.entity;

import com.cdc.changetracker.cdc.enums.DbType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "cdc_connection_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CdcConfig {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
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

    // AUDIT FIELDS WITH EXPLICIT COLUMN MAPPINGS
    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "updated_by")
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

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
