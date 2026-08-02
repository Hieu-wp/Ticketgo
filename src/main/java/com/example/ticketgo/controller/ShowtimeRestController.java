package com.example.ticketgo.controller;


import com.example.ticketgo.dto.request.ShowtimeCreateRequest;
import com.example.ticketgo.dto.request.ShowtimeUpdateRequest;
import com.example.ticketgo.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShowtimeRestController {

    private final ShowtimeService showtimeService;

    // Load tất cả suất chiếu cho Admin
    @GetMapping
    public ResponseEntity<?> getAllShowtimes(@RequestParam(defaultValue = "ALL") String status) {
        try {
            return ResponseEntity.ok(Map.of("success", true, "data", showtimeService.getAllShowtimes(status)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Load suất chiếu cho App Khách hàng (Lọc bỏ các phim bị HIDDEN)
    @GetMapping("/customer")
    public ResponseEntity<?> getCustomerShowtimes() {
        try {
            return ResponseEntity.ok(Map.of("success", true, "data", showtimeService.getCustomerShowtimes()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Lấy chi tiết 1 suất chiếu để đổ dữ liệu lên Modal Sửa
    @GetMapping("/{id}")
    public ResponseEntity<?> getShowtimeById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(Map.of("success", true, "data", showtimeService.getShowtimeById(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Thêm suất chiếu mới
    @PostMapping
    public ResponseEntity<?> createShowtime(@Valid @RequestBody ShowtimeCreateRequest request) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo lịch chiếu thành công!",
                    "data", showtimeService.createShowtimes(request)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Cập nhật/Sửa suất chiếu
    @PutMapping("/{id}")
    public ResponseEntity<?> updateShowtime(
            @PathVariable String id,
            @Valid @RequestBody ShowtimeUpdateRequest request
    ) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật suất chiếu thành công!",
                    "data", showtimeService.updateShowtime(id, request)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Toggle Ẩn / Hiện suất chiếu khỏi App Khách hàng
    @PatchMapping("/{id}/toggle-hide")
    public ResponseEntity<?> toggleHideShowtime(@PathVariable String id) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật trạng thái ẩn/hiện thành công!",
                    "data", showtimeService.toggleHideShowtime(id)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Xóa suất chiếu
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShowtime(@PathVariable String id) {
        try {
            showtimeService.deleteShowtime(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Xóa suất chiếu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
