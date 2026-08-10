package com.example.ticketgo.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeSummaryResponse {

    private String id;
    private String movieId;
    private String movieTitle;
    private String roomId;
    private String roomName;
    private LocalDate showDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Double regularPrice;
    private Double vipPrice;
}