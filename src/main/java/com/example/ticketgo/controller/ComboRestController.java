package com.example.ticketgo.controller;


import com.example.ticketgo.dto.request.ComboCreateRequest;
import com.example.ticketgo.service.ComboService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/combos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComboRestController {

    private final ComboService comboService;

    @GetMapping
    public ResponseEntity<?> getAllCombos() {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", comboService.getAllCombos()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCombo(@Valid @RequestBody ComboCreateRequest request) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo combo thành công!",
                    "data", comboService.createCombo(request)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
