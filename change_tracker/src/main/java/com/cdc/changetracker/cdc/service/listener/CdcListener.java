package com.cdc.changetracker.cdc.service.listener;

import com.cdc.changetracker.cdc.entity.CdcConfig;
import com.cdc.changetracker.cdc.enums.DbType;

import java.util.function.Consumer;

public interface CdcListener {

    DbType getSupportedDbType();

    void startListening(CdcConfig config, Consumer<String> eventConsumer);
}
