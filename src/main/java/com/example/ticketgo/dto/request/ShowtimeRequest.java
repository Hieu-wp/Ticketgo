package com.example.ticketgo.dto.request;
import com.example.ticketgo.dto.SlotDto;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ShowtimeRequest {
    private String phimId;
    private Boolean lapLaiHangNgay;
    private LocalDate singleDate; // Dùng khi không lặp lại
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private Integer soSuatTrongNgay;
    private List<SlotDto> slots;
}
