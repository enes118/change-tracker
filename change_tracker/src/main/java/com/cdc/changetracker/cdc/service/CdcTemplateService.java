package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.dto.CdcConfigTemplateRequestDto;
import com.cdc.changetracker.cdc.dto.CdcConfigTemplateResponseDto;
import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.enums.DbType;
import com.cdc.changetracker.cdc.mapper.CdcMapper;
import com.cdc.changetracker.cdc.repository.CdcConfigTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CdcTemplateService {

    private final CdcConfigTemplateRepository templateRepository;
    private final CdcMapper cdcMapper;

    public List<CdcConfigTemplateResponseDto> getAllActiveTemplates() {
        return templateRepository.findByActiveTrue().stream()
                .map(cdcMapper::toDto)
                .collect(Collectors.toList());
    }

    public Optional<CdcConfigTemplateResponseDto> getTemplateByDbType(DbType dbType) {
        return templateRepository.findByDbTypeAndActiveTrue(dbType)
                .map(cdcMapper::toDto);
    }

    public CdcConfigTemplateResponseDto saveOrUpdateTemplate(CdcConfigTemplateRequestDto requestDto) {
        CdcConfigTemplate template = templateRepository.findByDbTypeAndActiveTrue(requestDto.getDbType())
                .map(existing -> {
                    existing.setDescription(requestDto.getDescription());
                    existing.setTemplateJson(requestDto.getTemplateJson());
                    existing.setActive(requestDto.getActive() != null ? requestDto.getActive() : true);
                    return templateRepository.save(existing);
                })
                .orElseGet(() -> templateRepository.save(cdcMapper.toEntity(requestDto)));

        return cdcMapper.toDto(template);
    }

    public void deleteTemplate(Long id) {
        CdcConfigTemplate existing = findTemplateEntityById(id);
        templateRepository.delete(existing);
    }

    private CdcConfigTemplate findTemplateEntityById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CdcConfigTemplate bulunamadı! ID: " + id));
    }
}
