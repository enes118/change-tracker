package com.cdc.changetracker.cdc;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CdcConfigRepository extends JpaRepository<CdcConfig, Long> {
    Optional<CdcConfig> findFirstByActiveTrue();
}