package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "showtime_id", length = 50, nullable = false)
    private String showtimeId;

    @Column(name = "seat_number", length = 20, nullable = false)
    private String seatNumber; // Mã vị trí ghế lấy từ JSON (vd: A1, A2)

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "status", length = 20)
    private String status = "AVAILABLE";
}
