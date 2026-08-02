package com.example.ticketgo.dto.response;


import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


public record ShowtimeResponse (
        String id,
        ResponseMovie movie,
        ResponseScreeningRoom room,
        LocalDate showDate,
        LocalTime startTime,
        LocalTime endTime,
        Double regularPrice,
        Double vipPercent,
        Double vipPrice,
        String status,
        List<ComboResponse> combos
    ) {}
