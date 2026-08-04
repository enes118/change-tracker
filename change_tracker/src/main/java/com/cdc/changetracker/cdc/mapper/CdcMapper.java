package com.cdc.changetracker.cdc.mapper;

import com.cdc.changetracker.cdc.dto.CdcChangeEventResponseDto;
import com.cdc.changetracker.cdc.dto.CdcConfigRequestDto;
import com.cdc.changetracker.cdc.dto.CdcConfigResponseDto;
import com.cdc.changetracker.cdc.dto.CdcConfigTemplateRequestDto;
import com.cdc.changetracker.cdc.dto.CdcConfigTemplateResponseDto;
import com.cdc.changetracker.cdc.entity.CdcChangeEvent;
import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CdcMapper {

    @Mapping(target = "id", ignore = true)
    CdcConfig toEntity(CdcConfigRequestDto dto);

    @Mapping(target = "additionalProperties", expression = "java(entity.getAdditionalProperties())")
    CdcConfigResponseDto toDto(CdcConfig entity);

    @Mapping(target = "id", ignore = true)
    CdcConfigTemplate toEntity(CdcConfigTemplateRequestDto dto);

    @Mapping(target = "templateMap", expression = "java(entity.getTemplateMap())")
    CdcConfigTemplateResponseDto toDto(CdcConfigTemplate entity);

    @Mapping(source = "cdcConfig.id", target = "cdcConfigId")
    CdcChangeEventResponseDto toDto(CdcChangeEvent entity);
}
