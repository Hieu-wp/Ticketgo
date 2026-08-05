package com.example.ticketgo.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(min = 2, max = 40, message = "Tên danh mục phải có độ dài từ 2 đến 40 ký tự")
    private String name;

    private String description;

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(active|inactive)$", message = "Trạng thái chỉ chấp nhận 'active' hoặc 'inactive'")
    private String status;

    // Chỉ cần nhận ID của AgeRating thay vì cả object
    @Size(max = 5, message = "AgeRating ID không hợp lệ")
    private String ageRatingId;
}