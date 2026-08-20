package com.cdc.changetracker.cdc.dto;

import com.cdc.changetracker.cdc.enums.DbType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdcConfigResponseDto {

    private Long id;
    private String connectionName;
    private DbType dbType;
    private String dbHost;
    private Integer dbPort;
    private String dbName;
    private String dbUser;
    private String tableIncludeList;
    private String additionalPropertiesJson;
    private Map<String, String> additionalProperties;
    private Boolean active;

    // Audit fields for responses
    private String createdBy;
    private LocalDateTime createdDate;
    private String updatedBy;
    private LocalDateTime updatedDate;
}
