package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnlineHoldRequest {

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String customerId;

    @NotBlank(message = "Mã suất chiếu không được để trống")
    private String showtimeId;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    private List<String> selectedSeats;
}