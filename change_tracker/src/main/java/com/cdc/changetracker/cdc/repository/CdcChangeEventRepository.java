package com.cdc.changetracker.cdc.repository;

import com.cdc.changetracker.cdc.entity.CdcChangeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CdcChangeEventRepository extends JpaRepository<CdcChangeEvent, Long> {
    List<CdcChangeEvent> findAllByOrderByIdDesc();
    List<CdcChangeEvent> findByCdcConfigIdOrderByIdDesc(Long cdcConfigId);
    List<CdcChangeEvent> findTop5ByOrderByIdDesc();

    @Query("SELECT e.eventType, COUNT(e) FROM CdcChangeEvent e WHERE e.createdDate >= :since GROUP BY e.eventType")
    List<Object[]> countEventsByEventTypeSince(@Param("since") LocalDateTime since);
}
