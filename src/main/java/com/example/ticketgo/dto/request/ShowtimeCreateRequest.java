package com.example.ticketgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeCreateRequest {

    @NotBlank(message = "Vui lòng chọn phim")
    private String movieId;

    @NotBlank(message = "Vui lòng chọn phòng chiếu")
    private String roomId;

    @Builder.Default
    private Boolean isRepeat = false;

    // Dùng khi tạo 1 suất chiếu đơn (isRepeat = false)
    private LocalDate singleDate;

    // Dùng khi tạo chuỗi suất chiếu lặp theo ngày (isRepeat = true)
    private LocalDate startDate;
    private LocalDate endDate;

    // Danh sách các khung giờ chiếu trong ngày (ví dụ: [09:00, 14:30, 19:00])
    @NotEmpty(message = "Vui lòng chọn ít nhất 1 khung giờ chiếu")
    private List<LocalTime> startTimes;

    @NotNull(message = "Đơn giá vé ghế thường không được để trống")
    @Positive(message = "Đơn giá vé phải lớn hơn 0 VNĐ")
    private Double regularPrice;

    @NotNull(message = "Tỉ giá phần trăm ghế VIP không được để trống")
    private Double vipPercent; // Mặc định giao diện truyền 20.0

    // Danh sách ID Combo áp dụng (TÙY CHỌN - có thể gửi null hoặc mảng rỗng)
    private List<String> comboIds;
}