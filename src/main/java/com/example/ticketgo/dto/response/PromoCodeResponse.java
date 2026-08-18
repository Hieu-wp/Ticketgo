package com.example.ticketgo.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoCodeResponse<T> {

    private boolean success;
    private String message;
    private T data;

    // Thông tin phân trang (dành cho danh sách)
    private Integer currentPage;
    private Integer totalPages;
    private Long totalElements;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // Trả về thành công dữ liệu đơn (xem, thêm, sửa, xóa)
    public static <T> PromoCodeResponse<T> success(T data, String message) {
        return PromoCodeResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Trả về thành công kèm thông tin phân trang (danh sách)
    public static <T> PromoCodeResponse<T> success(T data, String message, int currentPage, int totalPages, long totalElements) {
        return PromoCodeResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .currentPage(currentPage)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Trả về thông báo lỗi
    public static <T> PromoCodeResponse<T> error(String message) {
        return PromoCodeResponse.<T>builder()
                .success(false)
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }
}