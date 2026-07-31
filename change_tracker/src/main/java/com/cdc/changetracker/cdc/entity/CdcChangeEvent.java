package com.cdc.changetracker.cdc.entity;

import com.cdc.changetracker.cdc.enums.DbType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cdc_change_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CdcChangeEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String connectionName;

    @Enumerated(EnumType.STRING)
    private DbType dbType;

    private String dbName;
    private String tableName;
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String oldDataJson;

    @Column(columnDefinition = "TEXT")
    private String newDataJson;

    private LocalDateTime createdDate;
}
