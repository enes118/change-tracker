package com.cdc.changetracker.cdc.dto;

import com.cdc.changetracker.cdc.enums.DbType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdcConfigRequestDto {

    private String connectionName;
    private DbType dbType;
    private String dbHost;
    private Integer dbPort;
    private String dbName;
    private String dbUser;
    private String dbPassword;
    private String tableIncludeList;
    private String additionalPropertiesJson;
    private Boolean active;
}
