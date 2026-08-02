package com.example.ticketgo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ShowtimeViewController {

    @GetMapping("/showtime")
    public String showtimePage() {
        return "Showtime"; // Trả về file Showtime.html trong folder src/main/resources/templates
    }
}