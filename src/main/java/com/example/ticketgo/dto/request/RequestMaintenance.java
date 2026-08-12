package com.example.ticketgo.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record RequestMaintenance(
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        LocalDateTime ngayBatDau,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        LocalDateTime ngayKetThuc,

        String loaiBaoTri,
        String nguoiThucHien,
        String trangThaiHoSo,
        Double chiPhi,
        String moTa,
        String ghiChu
) {}