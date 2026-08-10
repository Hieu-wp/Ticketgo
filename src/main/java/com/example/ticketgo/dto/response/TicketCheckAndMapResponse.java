package com.example.ticketgo.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketCheckAndMapResponse {
    private TicketCheckResponse ticket;
    private ShowtimeSeatMapResponse seatMap;
}