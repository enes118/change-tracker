package com.cdc.changetracker.cdc.repository;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CdcConfigRepository extends JpaRepository<CdcConfig, Long> {
    Optional<CdcConfig> findFirstByActiveTrue();
}
