package com.cdc.changetracker.cdc.service;

import com.cdc.changetracker.cdc.dto.CdcConfigRequestDto;
import com.cdc.changetracker.cdc.dto.CdcConfigResponseDto;
import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.mapper.CdcMapper;
import com.cdc.changetracker.cdc.repository.CdcConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CdcConfigService {

    private final CdcConfigRepository configRepository;
    private final CdcMapper cdcMapper;
    private final DynamicCdcService dynamicCdcService;

    /**
     * Oturum açmış olan kullanıcının kullanıcı adını (Keycloak / Spring Security JWT) güvenli şekilde çeker.
     */
    private String getCurrentAuthenticatedUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "Admin";
    }

    public CdcConfigResponseDto createConfig(CdcConfigRequestDto requestDto) {
        CdcConfig config = cdcMapper.toEntity(requestDto);
        if (config.getActive() == null) {
            config.setActive(true);
        }

        // Oturum açan gerçek kullanıcıyı Token'dan otomatik çek ve ata
        String username = getCurrentAuthenticatedUser();
        config.setCreatedBy(username);
        config.setUpdatedBy(username);

        CdcConfig saved = configRepository.save(config);

        if (Boolean.TRUE.equals(saved.getActive())) {
            try {
                dynamicCdcService.startListener(saved);
            } catch (Exception e) {
                System.err.println("Otomatik dinleyici başlatma uyarısı: " + e.getMessage());
            }
        }

        return cdcMapper.toDto(saved);
    }

    public List<CdcConfigResponseDto> getAllConfigs() {
        return configRepository.findAll().stream()
                .map(cdcMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<CdcConfigResponseDto> getRecentConfigs() {
        return configRepository.findTop3ByActiveTrueOrderByUpdatedDateDesc().stream()
                .map(cdcMapper::toDto)
                .collect(Collectors.toList());
    }

    public long getActiveConfigCount() {
        return configRepository.countByActiveTrue();
    }

    public CdcConfigResponseDto getConfigById(Long id) {
        return cdcMapper.toDto(findConfigEntityById(id));
    }

    public CdcConfigResponseDto updateConfig(Long id, CdcConfigRequestDto requestDto) {
        CdcConfig existing = findConfigEntityById(id);
        existing.setConnectionName(requestDto.getConnectionName());
        existing.setDbType(requestDto.getDbType());
        existing.setDbHost(requestDto.getDbHost());
        existing.setDbPort(requestDto.getDbPort());
        existing.setDbName(requestDto.getDbName());
        existing.setDbUser(requestDto.getDbUser());
        if (requestDto.getDbPassword() != null && !requestDto.getDbPassword().isBlank()) {
            existing.setDbPassword(requestDto.getDbPassword());
        }
        existing.setTableIncludeList(requestDto.getTableIncludeList());
        if (requestDto.getAdditionalPropertiesJson() != null) {
            existing.setAdditionalPropertiesJson(requestDto.getAdditionalPropertiesJson());
        }
        if (requestDto.getActive() != null) {
            existing.setActive(requestDto.getActive());
        }

        // Oturum açan gerçek kullanıcıyı Token'dan otomatik çek ve ata
        String username = getCurrentAuthenticatedUser();
        existing.setUpdatedBy(username);

        CdcConfig updated = configRepository.save(existing);

        try {
            dynamicCdcService.stopListener(id);
            if (Boolean.TRUE.equals(updated.getActive())) {
                dynamicCdcService.startListener(updated);
            }
        } catch (Exception e) {
            System.err.println("Otomatik dinleyici güncelleme uyarısı: " + e.getMessage());
        }

        return cdcMapper.toDto(updated);
    }

    public void deleteConfig(Long id) {
        CdcConfig existing = findConfigEntityById(id);

        try {
            dynamicCdcService.stopListener(id);
        } catch (Exception e) {
            System.err.println("Otomatik dinleyici durdurma uyarısı: " + e.getMessage());
        }

        configRepository.delete(existing);
    }

    public CdcConfigResponseDto toggleConfigStatus(Long id, boolean active) {
        CdcConfig existing = findConfigEntityById(id);
        existing.setActive(active);

        // Oturum açan gerçek kullanıcıyı Token'dan otomatik çek ve ata
        String username = getCurrentAuthenticatedUser();
        existing.setUpdatedBy(username);

        CdcConfig updated = configRepository.save(existing);

        try {
            if (active) {
                dynamicCdcService.startListener(updated);
            } else {
                dynamicCdcService.stopListener(id);
            }
        } catch (Exception e) {
            System.err.println("Otomatik dinleyici durum değiştirme uyarısı: " + e.getMessage());
        }

        return cdcMapper.toDto(updated);
    }

    private CdcConfig findConfigEntityById(Long id) {
        return configRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CdcConfig bulunamadı! ID: " + id));
    }
}
