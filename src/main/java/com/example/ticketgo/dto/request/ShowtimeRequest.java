package com.example.ticketgo.dto.request;
import com.example.ticketgo.dto.SlotDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class ShowtimeRequest {
    @NotBlank(message = "Vui lòng chọn phim")
    private String movieId;

    @NotBlank(message = "Vui lòng chọn phòng chiếu")
    private String roomId;

    @NotNull(message = "Thời lượng phim không được để trống")
    @Positive(message = "Thời lượng phải > 0")
    private Integer durationMinutes;

    // Switch bật/tắt lặp lại suất chiếu
    private Boolean isRepeat = false;

    // Sử dụng khi isRepeat = false
    private LocalDate singleDate;

    // Sử dụng khi isRepeat = true
    private LocalDate startDate;
    private LocalDate endDate;

    // Danh sách khung giờ bắt đầu trong ngày
    @NotEmpty(message = "Vui lòng nhập ít nhất 1 khung giờ chiếu")
    private List<LocalTime> startTimes;

    @NotNull(message = "Đơn giá vé ghế thường không được để trống")
    @Positive(message = "Giá vé phải > 0")
    private Double regularPrice;

    @NotNull(message = "Tỉ giá phần trăm ghế VIP không được để trống")
    private Double vipPercent; // Mặc định 20.0

    // Danh sách các ID Combo được chọn áp dụng (có thể rỗng)
    private List<String> comboIds;
}
