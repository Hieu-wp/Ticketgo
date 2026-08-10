package com.example.ticketgo.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionHistory {
    private String bookingCode; // Mã GD

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime transactionDate; // Ngày giao dịch (lấy từ createdAt của Booking)

    private String movieName; // Tên Phim (Lấy từ Booking -> Showtime -> Movie)
    private String roomName;  // Tên Phòng chiếu (Lấy từ Booking -> Showtime -> Room)
    private String seats;     // Số ghế (Chuỗi gộp từ List<Ticket> của Booking, vd: "H1, H2")
    private BigDecimal totalAmount; // Tổng tiền
    private String status;    // Trạng thái (VD: PAID, CANCELLED)
}