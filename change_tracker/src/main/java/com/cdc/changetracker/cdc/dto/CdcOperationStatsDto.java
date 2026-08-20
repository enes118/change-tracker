package com.cdc.changetracker.cdc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CdcOperationStatsDto {
    private long insertCount;
    private long updateCount;
    private long deleteCount;
    private long totalCount;
}
