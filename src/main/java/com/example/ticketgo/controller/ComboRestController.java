package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.ComboCreateRequest;
import com.example.ticketgo.entity.Combo;
import com.example.ticketgo.repository.ComboRepository;
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
    private final ComboRepository comboRepository;

    // =========================================================
    // LẤY TẤT CẢ COMBO
    // =========================================================

    @GetMapping
    public ResponseEntity<?> getAllCombos() {

        try {

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "data",
                            comboService.getAllCombos()
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // =========================================================
    // LẤY CHI TIẾT COMBO
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getComboById(
            @PathVariable String id
    ) {

        try {

            Combo combo =
                    comboRepository.findById(id)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy combo!"
                                    )
                            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "data", combo
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // =========================================================
    // TẠO COMBO
    // =========================================================

    @PostMapping
    public ResponseEntity<?> createCombo(
            @Valid
            @RequestBody ComboCreateRequest request
    ) {

        try {

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Tạo combo thành công!",
                            "data",
                            comboService.createCombo(request)
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // =========================================================
    // XÓA COMBO
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCombo(
            @PathVariable String id
    ) {

        try {

            comboService.deleteCombo(id);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Xóa combo thành công!"
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }
}