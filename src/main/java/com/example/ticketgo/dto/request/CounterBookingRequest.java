package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounterBookingRequest {

    @NotBlank(message = "Tên khách hàng không được để trống")
    private String customerName;

    private String customerPhone;

    @NotBlank(message = "Mã suất chiếu không được để trống")
    private String showtimeId;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    private List<String> selectedSeats;

    // Combo (không bắt buộc — khách có thể không chọn combo)
    private String comboId;
    private Double comboPrice;
    private String selectedDrink;
    private String selectedPopcorn;
    private Double seatPrice;
    private Double totalAmount;
}