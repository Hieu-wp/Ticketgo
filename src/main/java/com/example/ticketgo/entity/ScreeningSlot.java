package com.example.ticketgo.entity;


import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "screening_slot")
@Data
public class ScreeningSlot {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "khung_id", nullable = false)
    private Showtime showtime;

    @Column(name = "gio_bat_dau", nullable = false)
    private LocalTime gioBatDau;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phong_id", nullable = false)
    private ScreeningRoom room;

    // Lưu thêm ngày chiếu thực tế của ca để hỗ trợ truy vấn suất chiếu từng ngày
    @Column(name = "ngay_chieu", nullable = false)
    private LocalDate ngayChieu;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
