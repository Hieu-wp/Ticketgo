package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductCreateRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotBlank(message = "Loại sản phẩm không được để trống")
    private String type; // "POPCORN" hoặc "DRINK"

    private Double costPrice;
    private Double sellPrice;
    private Double price; // Nhận giá từ giao diện nếu FE gửi key "price"

    private Integer quantity;
}