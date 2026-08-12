package com.example.ticketgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceHistoryResponse {

    private String id;

    private String tenPhong;

    private String trangThai;

    private String loaiBaoTri;

    private String ngayBatDau;

    private String ngayKetThuc;

    private String nguoiThucHien;

    private Double chiPhi;

    private String moTa;

    private String ghiChu;
}