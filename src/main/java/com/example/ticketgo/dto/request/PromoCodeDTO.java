package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoCodeDTO {

    // === 1. THÔNG TIN CHÍNH (Xem, Thêm, Sửa) ===
    private String id; // ID 10 ký tự (Dùng cho Edit/Delete/Detail)

    @NotBlank(message = "Tên chương trình không được để trống")
    private String name;

    @NotBlank(message = "Mã giảm giá không được để trống")
    @Size(max = 20, message = "Mã tối đa 20 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Mã chỉ gồm chữ in hoa, số và dấu gạch dưới")
    private String code;

    @NotBlank(message = "Loại giảm giá không được để trống")
    @Pattern(regexp = "^(?i)(percent|fixed)$", message = "Loại giảm giá phải là 'percent' hoặc 'fixed'")
    private String discountType; // "percent" hoặc "fixed"

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "1.0", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    private BigDecimal maxDiscount;

    @NotNull(message = "Đơn tối thiểu không được để trống")
    @DecimalMin(value = "0.0", message = "Đơn tối thiểu không được âm")
    @Builder.Default
    private BigDecimal minOrder = BigDecimal.ZERO;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    @NotNull(message = "Số lượng mã không được để trống")
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    private Integer usageLimit;

    @Builder.Default
    private Integer usedCount = 0;

    @Builder.Default
    private String customerType = "Tất cả khách hàng";

    @Builder.Default
    private Boolean isActive = true;

    private OffsetDateTime createdAt;

    // === 2. DÀNH CHO TÌM KIẾM, LỌC & PHÂN TRANG ===
    @Builder.Default
    private String status = "all"; // "all", "active", "upcoming", "expired"

    private String keyword;        // Ô tìm kiếm #searchInput

    @Builder.Default
    private Integer page = 0;      // Trang hiện tại

    @Builder.Default
    private Integer size = 9;      // Số card hiển thị/trang

    // === 3. VALIDATION ĐỘNG CỦA SPRING BOOT (@Valid) ===

    // Valid 1: Nếu chọn 'percent' thì discountValue không được quá 100%
    @AssertTrue(message = "Mức giảm giá theo phần trăm không được vượt quá 100%")
    public boolean isDiscountValueValidForPercent() {
        if ("percent".equalsIgnoreCase(discountType) && discountValue != null) {
            return discountValue.compareTo(new BigDecimal("100")) <= 0;
        }
        return true;
    }

    // Valid 2: Ngày kết thúc phải bằng hoặc sau ngày bắt đầu
    @AssertTrue(message = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu")
    public boolean isEndDateAfterStartDate() {
        if (startDate != null && endDate != null) {
            return !endDate.isBefore(startDate);
        }
        return true;
    }
}