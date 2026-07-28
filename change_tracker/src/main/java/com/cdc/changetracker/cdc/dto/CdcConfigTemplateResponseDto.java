package com.cdc.changetracker.cdc.dto;

import com.cdc.changetracker.cdc.enums.DbType;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdcConfigTemplateResponseDto {

    private Long id;
    private DbType dbType;
    private String description;
    private String templateJson;
    private Map<String, String> templateMap;
    private Boolean active;
}
