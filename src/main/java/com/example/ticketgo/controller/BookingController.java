package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.CreateBookingRequest;
import com.example.ticketgo.dto.response.BookingResponse;
import com.example.ticketgo.dto.response.VerifyBookingResponse;
import com.example.ticketgo.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    /**
     * API Đặt vé mới (Xử lý đơn hàng, giữ/bán ghế, cộng tiền Combo và sinh mã vé 5 ký tự)
     * POST /api/bookings
     */
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * API Soát vé / Kiểm tra vé online

     */
    @GetMapping("/verify")
    public ResponseEntity<VerifyBookingResponse> verifyBooking(@RequestParam("query") String query) {
        VerifyBookingResponse response = bookingService.verifyBooking(query);
        return ResponseEntity.ok(response);
    }
}