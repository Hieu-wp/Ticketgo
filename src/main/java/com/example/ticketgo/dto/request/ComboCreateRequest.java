package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ComboCreateRequest {

    @NotBlank(message = "Tên combo không được để trống")
    private String name;

    @NotBlank(message = "Vui lòng chọn 1 loại bắp")
    private String popcornId; // ID Bắp dạng String (UUID)

    @NotEmpty(message = "Vui lòng chọn ít nhất 1 loại nước")
    private List<String> drinkIds; // Danh sách ID Nước dạng String
}
