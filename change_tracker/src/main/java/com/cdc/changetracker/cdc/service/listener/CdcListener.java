package com.cdc.changetracker.cdc.service.listener;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;

public interface CdcListener {
    DbType getSupportedDbType();
    void startListening(CdcConfig config);
    void stopListening(Long configId);
    boolean isRunning(Long configId);
}
