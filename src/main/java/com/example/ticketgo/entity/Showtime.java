package com.example.ticketgo.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "showtimes", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Khóa ngoại liên kết tới bảng movies
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Film movie;

    // Khóa ngoại liên kết tới bảng screening_room
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ScreeningRoom room;

    @Column(name = "show_date", nullable = false)
    private LocalDate showDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "regular_price", nullable = false)
    @Builder.Default
    private Double regularPrice = 0.0;

    @Column(name = "vip_percent", nullable = false)
    @Builder.Default
    private Double vipPercent = 20.0;

    // Cột được PostgreSQL tự tính (GENERATED ALWAYS AS) -> Không insert/update từ Spring Data JPA
    @Column(name = "vip_price", insertable = false, updatable = false)
    private Double vipPrice;

    @Builder.Default
    private String status = "ASSIGNED"; // 'EMPTY', 'ASSIGNED', 'HIDDEN'

    // Danh sách các Combo áp dụng cho Suất chiếu này
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "showtime_combos",
            schema = "public",
            joinColumns = @JoinColumn(name = "showtime_id"),
            inverseJoinColumns = @JoinColumn(name = "combo_id")
    )
    @Builder.Default
    private List<Combo> combos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}