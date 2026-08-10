package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.CounterBookingRequest;
import com.example.ticketgo.dto.response.*;
import com.example.ticketgo.service.CounterBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CounterBookingController {

    private final CounterBookingService counterBookingService;

    // Dẫn đến trang HTML giao diện quầy
    @GetMapping("/admin/ticket-desk")
    public String showTicketDeskPage() {
        return "TicketDesk";
    }

    // 1. Kiểm tra tính hợp lệ của vé
    @GetMapping("/api/counter/tickets/check")
    @ResponseBody
    public ResponseEntity<TicketCheckResponse> checkTicket(@RequestParam String code) {
        return ResponseEntity.ok(counterBookingService.checkTicket(code));
    }

    // 2. Lấy danh sách suất chiếu (Đã đổi thành /api/counter/showtimes để không bị trùng)
    @GetMapping("/api/counter/showtimes")
    @ResponseBody
    public ResponseEntity<List<ShowtimeSummaryResponse>> getShowtimesByMovie(@RequestParam String movieId) {
        return ResponseEntity.ok(counterBookingService.getShowtimesByMovie(movieId));
    }

    // 3. Lấy sơ đồ phòng & trạng thái ghế
    @GetMapping("/api/counter/seat-map/{showtimeId}")
    @ResponseBody
    public ResponseEntity<ShowtimeSeatMapResponse> getSeatMap(@PathVariable String showtimeId) {
        return ResponseEntity.ok(counterBookingService.getSeatMapByShowtime(showtimeId));
    }

    // 4. Tạo vé bán tại quầy
    @PostMapping("/api/counter/booking")
    @ResponseBody
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CounterBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(counterBookingService.createCounterBooking(request));
    }
    // 1. Kiểm tra vé + trả kèm sơ đồ phòng chiếu tương ứng
    @GetMapping("/api/counter/tickets/locate")
    @ResponseBody
    public ResponseEntity<TicketCheckAndMapResponse> checkTicketAndLocate(@RequestParam String code) {
        return ResponseEntity.ok(counterBookingService.checkTicketAndLocate(code));
    }
}