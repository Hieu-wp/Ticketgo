package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class ProductCreateRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotBlank(message = "Loại sản phẩm không được để trống")
    private String type; // "POPCORN" hoặc "DRINK"

    @NotNull(message = "Giá nhập không được để trống")
    @PositiveOrZero(message = "Giá nhập phải >= 0")
    private Double costPrice;

    @NotNull(message = "Giá bán không được để trống")
    @PositiveOrZero(message = "Giá bán phải >= 0")
    private Double sellPrice;
}