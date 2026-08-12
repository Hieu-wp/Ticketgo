package com.example.ticketgo.controller;

import com.example.ticketgo.dto.response.DashboardAnalyticsDTO;
import com.example.ticketgo.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;


    @GetMapping("/analytics")
    public String showAnalyticsPage() {
        return "Analytics";
    }


    @GetMapping("/api/analytics")
    @ResponseBody
    public ResponseEntity<DashboardAnalyticsDTO> getAnalytics(
            @RequestParam(defaultValue = "7d") String period,
            @RequestParam(defaultValue = "all") String roomId,
            @RequestParam(defaultValue = "all") String movieId) {

        DashboardAnalyticsDTO data = analyticsService.getDashboardData(period, roomId, movieId);
        return ResponseEntity.ok(data);
    }
}