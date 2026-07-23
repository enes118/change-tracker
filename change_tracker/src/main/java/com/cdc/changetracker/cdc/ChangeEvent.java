package com.cdc.changetracker.cdc;

public record ChangeEvent(String tableName, String operationType, String rawData){}
