package com.cdc.changetracker.cdc.repository;

import com.cdc.changetracker.cdc.entity.CdcChangeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CdcChangeEventRepository extends JpaRepository<CdcChangeEvent, Long> {
    List<CdcChangeEvent> findTop100ByOrderByIdDesc();
}
