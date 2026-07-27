package com.cdc.changetracker.cdc.repository;

import com.cdc.changetracker.cdc.entity.CdcConfigTemplate;
import com.cdc.changetracker.cdc.enums.DbType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CdcConfigTemplateRepository extends JpaRepository<CdcConfigTemplate, Long> {
    Optional<CdcConfigTemplate> findByDbTypeAndActiveTrue(DbType dbType);
    List<CdcConfigTemplate> findByActiveTrue();
}
