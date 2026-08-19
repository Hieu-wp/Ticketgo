package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ComboCreateRequest {

    @NotBlank(message = "Tên combo không được để trống")
    private String name;

    @NotBlank(message = "Vui lòng chọn bắp")
    private String popcornId;

    private Integer popcornQuantity;

    @NotEmpty(message = "Vui lòng chọn ít nhất 1 loại nước")
    private List<ComboDrinkItem> drinks;

    // Bổ sung nhận giá combo từ giao diện
    private Double comboPrice;

    @Data
    public static class ComboDrinkItem {
        private String productId;
        private Integer quantity;
    }
}