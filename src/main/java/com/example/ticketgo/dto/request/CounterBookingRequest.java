package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounterBookingRequest {

    @NotBlank(message = "Tên khách hàng không được để trống")
    private String customerName;

    private String customerPhone;

    @NotBlank(message = "Mã suất chiếu không được để trống")
    private String showtimeId;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    private List<String> selectedSeats;

    // =========================================================
    // COMBO
    // =========================================================

    private String comboId;

    // Giá combo frontend gửi lên chỉ để tham khảo.
    // Backend PHẢI lấy giá thật từ Combo trong database.
    private Double comboPrice;

    // Tên sản phẩm nước được khách chọn
    private String selectedDrink;

    // Tên sản phẩm bắp của combo
    private String selectedPopcorn;

    // Tổng tiền ghế frontend gửi lên chỉ để tham khảo.
    // Backend tự tính lại.
    private Double seatPrice;

    // Tổng tiền frontend gửi lên chỉ để tham khảo.
    // Backend tự tính lại.
    private Double totalAmount;

    // =========================================================
    // MÃ GIẢM GIÁ
    // =========================================================

    // Ví dụ: SALE10
    private String promoCode;

    // Số tiền giảm frontend tính được.
    // Backend KHÔNG tin giá trị này, phải tự kiểm tra lại voucher.
    private Double discountAmount;
}