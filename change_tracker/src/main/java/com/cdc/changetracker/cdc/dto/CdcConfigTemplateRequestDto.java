package com.cdc.changetracker.cdc.dto;

import com.cdc.changetracker.cdc.enums.DbType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdcConfigTemplateRequestDto {

    private DbType dbType;
    private String description;
    private String templateJson;
    private Boolean active;
}
