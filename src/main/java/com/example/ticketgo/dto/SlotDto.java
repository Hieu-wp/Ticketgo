package com.example.ticketgo.dto;


import lombok.Data;
import java.time.LocalTime;

@Data
public class SlotDto {
    private String phongId; // ID dạng String/Char
    private LocalTime gioBatDau;
}
