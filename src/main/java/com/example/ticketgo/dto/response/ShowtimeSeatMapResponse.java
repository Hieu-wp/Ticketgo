package com.example.ticketgo.dto.response;

import com.example.ticketgo.dto.SeatLayout;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeSeatMapResponse {

    private String showtimeId;
    private String movieId;
    private String movieTitle;
    private String roomId;
    private String roomName;
    private LocalDate showDate;
    private LocalTime startTime;
    private Double regularPrice;
    private Double vipPrice;

    // Thêm mới: thông tin bố cục phòng
    private Boolean coLoiDi;
    private Integer soHangGhe;
    private Integer soCotGhe;

    private List<SeatLayout> seatLayout;
    private List<String> soldSeats;
    private List<String> holdingSeats;

    // Thêm mới: chi tiết khách hàng theo từng ghế đã bán/giữ chỗ
    private List<SeatOccupantDetail> seatDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatOccupantDetail {
        private String seatCode;
        private String customerName;
        private String customerPhone;
        private String ticketCode;
        private String status;
        private String seatType;        // <-- thêm: VIP/NORMAL thật từ DB, không cần frontend tự đoán
        private Double ticketPrice;     // <-- thêm: giá vé thật đã lưu lúc tạo, không suy đoán lại
        private String paymentMethod;
        // Thông tin cấp Booking (dùng chung cho mọi ghế trong cùng 1 đơn)
        private String bookingCode;
        private String comboName;
        private Double comboPrice;
        private Double totalAmount;     // tổng tiền cả đơn (tất cả ghế + combo)
    }
}