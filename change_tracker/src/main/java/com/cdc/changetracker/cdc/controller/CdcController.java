package com.cdc.changetracker.cdc.controller;

import com.cdc.changetracker.cdc.service.DynamicCdcService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cdc")
@RequiredArgsConstructor
public class CdcController {

    private final DynamicCdcService cdcService;

    @GetMapping("/start")
    public String startCdc() {
        cdcService.startDynamicReplication();
        return "CDC Dinlemesi Arka Planda Başlatıldı!";
    }

    @GetMapping("/events")
    public List<String> getEvents() {
        return cdcService.getCapturedEvents();
    }
}
