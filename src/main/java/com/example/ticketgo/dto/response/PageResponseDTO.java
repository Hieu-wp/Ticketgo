package com.example.ticketgo.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponseDTO<T> {
    private List<T> content;      // Danh sách dữ liệu
    private int pageNo;           // Trang hiện tại
    private int pageSize;         // Số phần tử trên 1 trang
    private long totalElements;   // Tổng số phần tử
    private int totalPages;       // Tổng số trang
    private boolean isLast;       // Cờ kiểm tra trang cuối
}