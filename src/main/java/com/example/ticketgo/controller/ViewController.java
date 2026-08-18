package com.example.ticketgo.controller;

import com.example.ticketgo.entity.Film;
import com.example.ticketgo.service.FilmService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ViewController {

    private final FilmService filmService;

    // Trả về trang đăng nhập login.html khi truy cập /login
    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }


}