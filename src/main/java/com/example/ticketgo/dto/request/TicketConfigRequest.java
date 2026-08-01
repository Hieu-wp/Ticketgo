package com.example.ticketgo.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TicketConfigRequest {
    private String movieId;
    private LocalDate showDate;
    private List<String> showtimeIds; // Danh sách ID suất chiếu
    private Double regularPrice;
    private Double vipPercent;
}