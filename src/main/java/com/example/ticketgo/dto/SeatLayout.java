package com.example.ticketgo.dto;

import java.io.Serializable;

public record SeatLayout(
        String code, // Vụ dụ: "A01"
        String row,  // Ví dụ: "A"
        Integer col, // Ví dụ: 1
        String type  // "NORMAL", "VIP", "COUPLE"
) implements Serializable {}