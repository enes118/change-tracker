package com.cdc.changetracker.cdc.dto;

import com.cdc.changetracker.cdc.enums.DbType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdcChangeEventResponseDto {

    private Long id;
    private Long cdcConfigId;
    private String connectionName;
    private DbType dbType;
    private String dbName;
    private String tableName;
    private String eventType;
    private String oldDataJson;
    private String newDataJson;
    private LocalDateTime createdDate;
}
