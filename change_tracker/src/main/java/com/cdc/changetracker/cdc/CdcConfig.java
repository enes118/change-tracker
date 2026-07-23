package com.cdc.changetracker.cdc;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cdc_connection_config")
@Data
public class CdcConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String connectionName;
    private String dbHost;
    private Integer dbPort;
    private String dbName;
    private String dbUser;
    private String dbPassword;
    private String slotName;
    private String pluginName;
    private Boolean active;
}