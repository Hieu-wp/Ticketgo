package com.example.ticketgo.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketCheckResponse {

    private String ticketId;
    private String status; // 'SOLD', 'HOLDING', 'EXPIRED', 'CANCELLED'
    private boolean isValid;
    private String message;

    // Thông tin chi tiết vé
    private String customerName;
    private String customerPhone;
    private String movieTitle;
    private String roomName;
    private String seatNumber;
    private LocalDate showDate;
    private LocalTime startTime;
    private Double price;
    private LocalDateTime createdAt;
    private String showtimeId;
}