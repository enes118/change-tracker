package com.cdc.changetracker.cdc.dto;

public record ChangeEvent(String tableName, String operationType, String rawData){}
