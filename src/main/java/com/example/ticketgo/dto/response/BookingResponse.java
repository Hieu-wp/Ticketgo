package com.example.ticketgo.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private String bookingId;
    private String bookingCode;
    private LocalDate bookingDate;
    private String movieName;
    private String roomName;
    private String showtimeInfo;
    private String customerName;
    private String customerPhone;
    private List<String> seats;
    private String comboName;
    private BigDecimal totalAmount;
    private List<TicketDetail> tickets;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketDetail {
        private String ticketId;
        private String ticketCode;
        private String seatCode;
        private BigDecimal price;
    }
}