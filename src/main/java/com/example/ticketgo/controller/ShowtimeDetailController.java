package com.example.ticketgo.controller;

import org.springframework.stereotype.Controller; // THÊM IMPORT NÀY
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ShowtimeDetailController {

    @GetMapping("/showtimedetail")
    public String getShowtimeDetailPage() {
        return "ShowtimeDetail";
    }
}