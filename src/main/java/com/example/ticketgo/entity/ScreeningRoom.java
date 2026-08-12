package com.example.ticketgo.entity;
import com.example.ticketgo.dto.SeatLayout;
import com.example.ticketgo.entity.generator.ScreeningRoomID;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;

@Entity
@Table(name = "screening_room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ScreeningRoom {
    @Id
    @GeneratedValue(generator = "ID_phongchieu")
    @GenericGenerator(name = "ID_phongchieu", type = ScreeningRoomID.class)
    @Column(name = "id", length = 10, nullable = false, updatable = false)
    private String id;

    @Column(name = "ten_phong", nullable = false, length = 100)
    private String tenPhong;
    @Column(name = "so_luong_ghe_thuong", nullable = false)
    private Integer soLuongGheThuong;
    @Column(name = "so_hang_ghe", nullable = false)
    private Integer soHangGhe;
    @Column(name = "so_cot_ghe", nullable = false)
    private Integer soCotGhe;
    @Column(name = "so_luong_ghe_vip", nullable = false)
    private Integer soLuongGheVip;
    @Column(name = "co_loi_di", nullable = false)
    private Boolean coLoiDi;
    @Column(name = "tong_so_ghe", nullable = false)
    private Integer tongSoGhe;
    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @PrePersist
    @PreUpdate
    public void calculateTongSoGhe() {
        int gheThuong = (this.soLuongGheThuong != null) ? this.soLuongGheThuong : 0;
        int gheVip = (this.soLuongGheVip != null) ? this.soLuongGheVip : 0;
        this.tongSoGhe = gheThuong + gheVip;
    }
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "seat_layout", columnDefinition = "jsonb")
    private List<SeatLayout> seatLayout;
}

