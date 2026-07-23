package com.cdc.changetracker.cdc;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/cdc")
public class CdcController {

    private final PostgresCdcService cdcService;

    public CdcController(PostgresCdcService cdcService) {
        this.cdcService = cdcService;
    }

    @GetMapping("/events")
    public List<String> getEvents() {
        // Metot void olduğu için burada direkt çağırıyoruz
        cdcService.startReplication();

        // Dışarıya şimdilik bilgi amaçlı bir mesaj dönelim
        return Collections.singletonList("CDC replication başlatıldı/çalışıyor.");
    }
}