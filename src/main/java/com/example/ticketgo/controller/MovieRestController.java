package com.example.ticketgo.controller;



import com.example.ticketgo.repository.FilmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MovieRestController {

    private final FilmRepository filmRepository;

    @GetMapping
    public ResponseEntity<?> getAllMovies() {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", filmRepository.findAll()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
