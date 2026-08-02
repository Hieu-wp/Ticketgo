package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class ShowtimeUpdateRequest {

    @NotNull(message = "ID phim không được để trống")
    private String movieId;

    @NotNull(message = "ID phòng không được để trống")
    private String roomId;

    @NotNull(message = "Ngày chiếu không được để trống")
    private LocalDate showDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giá vé ghế thường không được để trống")
    @Positive(message = "Giá vé phải lớn hơn 0")
    private Double regularPrice;

    @NotNull(message = "Tỉ giá phần trăm ghế VIP không được để trống")
    private Double vipPercent;

    private List<String> comboIds; // Có thể rỗng/null

    private String status; // 'ASSIGNED', 'HIDDEN', 'EMPTY'
}