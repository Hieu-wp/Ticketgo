package com.example.ticketgo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class CategoryViewController {

    @GetMapping("/categories")
    public String showCategoriesPage() {

        return "Categories.html";
    }
}
