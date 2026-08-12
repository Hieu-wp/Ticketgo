package com.example.ticketgo.controller;

import com.example.ticketgo.repository.ScreeningRoomRepository;
import com.example.ticketgo.service.MaintenanceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScreeningRoomRestController {

    private final ScreeningRoomRepository screeningRoomRepository;
    private final MaintenanceHistoryService maintenanceHistoryService;

    @GetMapping
    public ResponseEntity<?> getAllRooms() {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", screeningRoomRepository.findAll()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

}