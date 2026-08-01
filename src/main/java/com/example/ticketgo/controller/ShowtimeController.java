package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.ShowtimeRequest;
import com.example.ticketgo.repository.FilmRepository;
import com.example.ticketgo.repository.ScreeningRoomRepository;
import com.example.ticketgo.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShowtimeController {

    private final FilmRepository movieRepository;
    private final ScreeningRoomRepository screeningRoomRepository;
    private final ShowtimeService showtimeService;


    @GetMapping("/showtime")
    public String showtimePage() {
        return "Showtime"; // Trả về file Showtime.html trong folder templates
    }


    @GetMapping("/api/movies")
    @ResponseBody
    public ResponseEntity<?> getMovies() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", movieRepository.findAll()
        ));
    }


    @GetMapping("/api/rooms")
    @ResponseBody
    public ResponseEntity<?> getRooms() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", screeningRoomRepository.findAll()
        ));
    }


    @GetMapping("/api/showtimes")
    @ResponseBody
    public ResponseEntity<?> getAllShowtimes() {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", showtimeService.getAllShowtimes()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi lấy danh sách suất chiếu: " + e.getMessage()
            ));
        }
    }

    /**
     * Tạo lịch chiếu mới: POST http://localhost:8080/api/showtimes
     */
    @PostMapping("/api/showtimes")
    @ResponseBody
    public ResponseEntity<?> createShowtime(@RequestBody ShowtimeRequest request) {
        try {
            showtimeService.createShowtime(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo lịch chiếu thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Không thể tạo lịch chiếu: " + e.getMessage()
            ));
        }
    }

    /**
     * Xóa suất chiếu theo ID: DELETE http://localhost:8080/api/showtimes/{id}
     */
    @DeleteMapping("/api/showtimes/{id}")
    @ResponseBody
    public ResponseEntity<?> deleteShowtime(@PathVariable Long id) {
        try {
            showtimeService.deleteShowtime(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Xóa suất chiếu thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi khi xóa suất chiếu: " + e.getMessage()
            ));
        }
    }
}