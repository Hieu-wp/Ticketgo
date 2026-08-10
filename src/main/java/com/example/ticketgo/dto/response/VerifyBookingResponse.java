package com.example.ticketgo.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyBookingResponse {

    private String bookingId;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private String movieName;
    private String showtime;
    private List<String> seats;
    private String paymentStatus;
    private String comboDetail;
    private BigDecimal totalAmount;
}