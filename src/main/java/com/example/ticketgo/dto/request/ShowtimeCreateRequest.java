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


    @Builder.Default
    private Boolean isConfirmSkipInvalid = false;

    private LocalDate singleDate;
    private LocalDate startDate;
    private LocalDate endDate;

    @NotEmpty(message = "Vui lòng chọn ít nhất 1 khung giờ chiếu")
    private List<LocalTime> startTimes;

    @NotNull(message = "Đơn giá vé ghế thường không được để trống")
    @Positive(message = "Đơn giá vé phải lớn hơn 0 VNĐ")
    private Double regularPrice;

    @NotNull(message = "Tỉ giá phần trăm ghế VIP không được để trống")
    private Double vipPercent;

    private List<String> comboIds;
}