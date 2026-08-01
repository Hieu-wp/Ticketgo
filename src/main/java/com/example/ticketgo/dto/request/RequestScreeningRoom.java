package com.example.ticketgo.dto.request;

import com.example.ticketgo.dto.SeatLayout;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record RequestScreeningRoom(

        @NotBlank(message = "Vui lòng nhập tên phòng")
        String tenPhong,

        @NotNull(message = "Vui lòng chọn số lượng ghế thường")
        @PositiveOrZero(message = "Số lượng ghế thường phải >= 0")
        Integer soLuongGheThuong,

        @NotNull(message = "Vui lòng chọn số hàng ghế")
        @PositiveOrZero(message = "Số lượng hàng ghế phải >= 0")
        Integer soHangGhe,

        @NotNull(message = "Vui lòng chọn số lượng cột ghế")
        @PositiveOrZero(message = "Số lượng cột ghế phải >= 0")
        Integer soCotGhe,

        @NotNull(message = "Vui lòng chọn số lượng ghế Vip")
        @PositiveOrZero(message = "Số lượng ghế Vip phải >= 0")
        Integer soLuongGheVip,

        @NotNull(message = "Trạng thái lối đi không được để null")
        Boolean coLoiDi,

        @Valid
        List<SeatLayout> seatLayout
) {}