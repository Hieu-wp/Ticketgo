package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketConfig {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "movie_id", length = 50, nullable = false)
    private String movieId;

    @Column(name = "show_date", nullable = false)
    private LocalDate showDate;

    @Column(name = "regular_price", nullable = false)
    private Double regularPrice;

    @Column(name = "vip_percent", nullable = false)
    private Double vipPercent;

    @Column(name = "vip_price", nullable = false)
    private Double vipPrice;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}