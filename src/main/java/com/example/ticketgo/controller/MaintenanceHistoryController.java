package com.example.ticketgo.controller;

import com.example.ticketgo.dto.response.MaintenanceHistoryResponse;
import com.example.ticketgo.service.MaintenanceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class MaintenanceHistoryController {

    private final MaintenanceHistoryService maintenanceHistoryService;


    @GetMapping("/maintenance_history")
    public String showMaintenanceHistoryPage() {
        return "MaintenanceHistory";
    }


    @GetMapping("/screening-rooms/api/maintenance-history")
    @ResponseBody
    public ResponseEntity<List<MaintenanceHistoryResponse>> getMaintenanceHistory(
            @RequestParam(required = false) String tenPhong,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String loaiBaoTri) {

        List<MaintenanceHistoryResponse> historyList = maintenanceHistoryService.filterHistory(tenPhong, trangThai, loaiBaoTri);
        return ResponseEntity.ok(historyList);
    }
    @GetMapping("/api/maintenance-history/active")
    public ResponseEntity<?> getActiveMaintenance(@RequestParam String roomId) {
        try {
            return ResponseEntity.ok(maintenanceHistoryService.getActiveMaintenanceByRoomId(roomId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}