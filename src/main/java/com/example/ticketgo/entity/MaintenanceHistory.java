package com.example.ticketgo.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceHistory {
    @Id
    @Column(length = 10, nullable = false, updatable = false)
    private String id;
    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = "BT-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
    }

    @ManyToOne
    @JoinColumn(name = "phong_id", nullable = false)
    private ScreeningRoom screeningRoom;

    // Trong entity MaintenanceHistory.java
    @Column(name = "ngay_bat_dau", columnDefinition = "TIMESTAMP")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc", columnDefinition = "TIMESTAMP")
    private LocalDateTime ngayKetThuc;
    private String loaiBaoTri;
    private String nguoiThucHien;
    private String trangThai; // "Đang thực hiện", "Hoàn thành"
    private Double chiPhi;
    private String moTa;
    private String ghiChu;
}