package com.example.ticketgo.dto.response;

import com.example.ticketgo.dto.SeatLayout;

import java.util.List;

public record ResponseScreeningRoom(
        String id,
        String tenPhong,
        Integer soLuongGheThuong,
        Integer soLuongGheVip,
        Integer soHangGhe,
        Integer soCotGhe,
        Integer tongSoGhe,
        Boolean coLoiDi,
        String trangThai,
        List<SeatLayout> seatLayout
) {}