package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {

    @NotNull(message = "Suất chiếu không được để trống")
    private String showtimeId;

    @NotNull(message = "Thông tin khách hàng không được để trống")
    private CustomerInfo customer;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    private List<String> seats;

    private ComboSelection combo;

    private String paymentMethod;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerInfo {
        @NotNull(message = "Tên khách hàng không được để trống")
        private String name;
        private String phone;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComboSelection {
        private String comboId;
        private List<String> drinks;
        private List<String> popcorns;
    }
}