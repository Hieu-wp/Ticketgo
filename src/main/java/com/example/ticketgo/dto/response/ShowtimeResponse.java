package com.example.ticketgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowtimeResponse {
    private String id;             // Mã suất chiếu
    private String movie;          // Tên phim
    private String room;           // Tên phòng chiếu
    private String time;           // Giờ bắt đầu
    private LocalDate date;        // Ngày chiếu
    private Integer duration;      // Thời lượng
    private Boolean isAssigned;    // Status: true (Đã cấu hình vé) / false (Đang trống)
    private Integer ticketsSold;   // Số lượng vé đã bán
    private Integer totalSeats;    // Tổng số ghế
    private Double regularPrice;   // Giá vé thường
    private Double vipPrice;       // Giá vé VIP
}
