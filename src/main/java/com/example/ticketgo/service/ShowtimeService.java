package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.ShowtimeCreateRequest;
import com.example.ticketgo.dto.request.ShowtimeUpdateRequest;
import com.example.ticketgo.dto.response.*;
import com.example.ticketgo.entity.Combo;
import com.example.ticketgo.entity.Film;
import com.example.ticketgo.entity.ScreeningRoom;
import com.example.ticketgo.entity.Showtime;
import com.example.ticketgo.exception.InvalidInputException;
import com.example.ticketgo.exception.ResourceNotFoundException;
import com.example.ticketgo.repository.ComboRepository;
import com.example.ticketgo.repository.FilmRepository;
import com.example.ticketgo.repository.ScreeningRoomRepository;
import com.example.ticketgo.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final FilmRepository movieRepository;
    private final ScreeningRoomRepository roomRepository;
    private final ComboRepository comboRepository;
    private final ComboService comboService;


    // 1. CHỨC NĂNG THÊM MỚI

    @Transactional
    public List<ShowtimeResponse> createShowtimes(ShowtimeCreateRequest request) {
        LocalDate today = LocalDate.now();
        LocalTime timeLimit = LocalTime.now().plusHours(1); // Mốc thời gian: Hiện tại + 1 giờ

        Film movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim!"));

        ScreeningRoom room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chiếu!"));

        validatePrices(request.getRegularPrice(), request.getVipPercent());

        // Xử lý danh sách ngày
        List<LocalDate> datesToSchedule = new ArrayList<>();
        if (Boolean.TRUE.equals(request.getIsRepeat())) {
            if (request.getStartDate() == null || request.getEndDate() == null) {
                throw new InvalidInputException("Vui lòng chọn ngày bắt đầu và kết thúc chuỗi lặp!");
            }
            if (request.getStartDate().isBefore(today)) {
                throw new InvalidInputException("Ngày bắt đầu không được nhỏ hơn ngày hiện tại!");
            }
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new InvalidInputException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
            }

            LocalDate current = request.getStartDate();
            while (!current.isAfter(request.getEndDate())) {
                datesToSchedule.add(current);
                current = current.plusDays(1);
            }
        } else {
            if (request.getSingleDate() == null || request.getSingleDate().isBefore(today)) {
                throw new InvalidInputException("Ngày chiếu không hợp lệ hoặc đã ở quá khứ!");
            }
            datesToSchedule.add(request.getSingleDate());
        }

        List<Combo> selectedCombos = getCombosFromIds(request.getComboIds());
        List<Showtime> validShowtimesToCreate = new ArrayList<>();
        List<String> invalidTimeMessages = new ArrayList<>();

        for (LocalDate showDate : datesToSchedule) {
            for (LocalTime startTime : request.getStartTimes()) {

                // KIỂM TRA ĐIỀU KIỆN GIỜ CHIẾU VỚI NGÀY HÔM NAY (Phải > Hiện tại + 1 tiếng)
                if (showDate.isEqual(today) && !startTime.isAfter(timeLimit)) {
                    if (Boolean.TRUE.equals(request.getIsRepeat())) {
                        // Trường hợp LẶP: Ghi nhận vết lỗi để hỏi xác nhận
                        invalidTimeMessages.add(String.format("%s ngày %s", startTime, showDate));
                        continue;
                    } else {
                        // Trường hợp ĐƠN LẺ: Bắn lỗi ngay lập tức
                        throw new InvalidInputException("Thời gian chiếu đã qua, vui lòng chọn thời gian khác!");
                    }
                }

                LocalTime endTime = startTime.plusMinutes(movie.getDuration());

                // Kiểm tra trùng lịch
                if (showtimeRepository.existsOverlappingShowtime(room.getId(), showDate, startTime, endTime)) {
                    throw new InvalidInputException(String.format(
                            "Phòng '%s' đã có suất chiếu trùng khung giờ %s - %s ngày %s!",
                            room.getTenPhong(), startTime, endTime, showDate));
                }

                Showtime showtime = Showtime.builder()
                        .movie(movie)
                        .room(room)
                        .showDate(showDate)
                        .startTime(startTime)
                        .endTime(endTime)
                        .regularPrice(request.getRegularPrice())
                        .vipPercent(request.getVipPercent())
                        .status("ASSIGNED")
                        .combos(selectedCombos)
                        .build();

                validShowtimesToCreate.add(showtime);
            }
        }

        // BẮT CỜ XÁC NHẬN CHO TRƯỜNG HỢP LẶP LỊCH
        if (!invalidTimeMessages.isEmpty()) {
            if (!Boolean.TRUE.equals(request.getIsConfirmSkipInvalid())) {
                String errorMsg = "Thời gian suất chiếu " + String.join(", ", invalidTimeMessages) +
                        " đã qua. Bạn có muốn tạo các suất chiếu hợp lệ còn lại không? | REQUIRE_CONFIRM";
                throw new InvalidInputException(errorMsg);
            }
        }

        if (validShowtimesToCreate.isEmpty()) {
            throw new InvalidInputException("Không có suất chiếu nào hợp lệ để tạo!");
        }

        // Tối ưu lưu hàng loạt
        List<Showtime> createdList = showtimeRepository.saveAll(validShowtimesToCreate);
        return createdList.stream().map(this::mapToResponse).toList();
    }

    // =========================================================================
    // 2. CHỨC NĂNG LOAD DỮ LIỆU LÊN CARD (Lấy danh sách / Chi tiết)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getAllShowtimes(String status) {
        List<Showtime> list;
        if ("ALL".equalsIgnoreCase(status) || status == null) {
            list = showtimeRepository.findAll();
        } else {
            list = showtimeRepository.findByStatus(status.toUpperCase());
        }
        return list.stream().map(this::mapToResponse).toList();
    }

    // Dành riêng cho APP KHÁCH HÀNG: Chỉ lấy các suất chiếu không bị ẨN
    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getCustomerShowtimes() {
        return showtimeRepository.findByStatusNot("HIDDEN")
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShowtimeResponse getShowtimeById(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu ID: " + id));
        return mapToResponse(showtime);
    }


    // 3. CHỨC NĂNG SỬA SUẤT CHIẾU

    @Transactional
    public ShowtimeResponse updateShowtime(String id, ShowtimeUpdateRequest request) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu ID: " + id));

        LocalDate today = LocalDate.now();
        LocalTime timeLimit = LocalTime.now().plusHours(1);

        if (request.getShowDate().isBefore(today)) {
            throw new InvalidInputException("Ngày chiếu không được ở quá khứ!");
        }

        // KIỂM TRA ĐIỀU KIỆN GIỜ CHIẾU KHI SỬA THÀNH NGÀY HÔM NAY
        if (request.getShowDate().isEqual(today) && !request.getStartTime().isAfter(timeLimit)) {
            throw new InvalidInputException("Thời gian chiếu đã qua, vui lòng chọn thời gian khác!");
        }

        Film movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim!"));

        ScreeningRoom room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chiếu!"));

        validatePrices(request.getRegularPrice(), request.getVipPercent());

        LocalTime endTime = request.getStartTime().plusMinutes(movie.getDuration());

        // Kiểm tra trùng lịch (loại trừ chính suất chiếu đang sửa)
        boolean isOverlapped = showtimeRepository.existsOverlappingShowtimeExcludingId(
                room.getId(), request.getShowDate(), request.getStartTime(), endTime, id
        );

        if (isOverlapped) {
            throw new InvalidInputException(String.format(
                    "Khung giờ %s - %s ngày %s tại phòng '%s' bị trùng với suất chiếu khác!",
                    request.getStartTime(), endTime, request.getShowDate(), room.getTenPhong()));
        }

        // Cập nhật thông tin
        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setShowDate(request.getShowDate());
        showtime.setStartTime(request.getStartTime());
        showtime.setEndTime(endTime);
        showtime.setRegularPrice(request.getRegularPrice());
        showtime.setVipPercent(request.getVipPercent());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            showtime.setStatus(request.getStatus().toUpperCase());
        }

        showtime.setCombos(getCombosFromIds(request.getComboIds()));

        Showtime updated = showtimeRepository.save(showtime);
        return mapToResponse(updated);
    }

    // =========================================================================
    // 4. CHỨC NĂNG XÓA SUẤT CHIẾU
    // =========================================================================
    @Transactional
    public void deleteShowtime(String id) {
        if (!showtimeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy suất chiếu để xóa ID: " + id);
        }
        showtimeRepository.deleteById(id);
    }

    // =========================================================================
    // 5. CHỨC NĂNG ẨN / HIỆN SUẤT CHIẾU (Ẩn khỏi App Khách Hàng)
    // =========================================================================
    @Transactional
    public ShowtimeResponse toggleHideShowtime(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu ID: " + id));

        // Nút toggle: Nếu đang HIDDEN thì mở lại ASSIGNED, ngược lại thì chuyển sang HIDDEN
        if ("HIDDEN".equalsIgnoreCase(showtime.getStatus())) {
            showtime.setStatus("ASSIGNED");
        } else {
            showtime.setStatus("HIDDEN");
        }

        Showtime updated = showtimeRepository.save(showtime);
        return mapToResponse(updated);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    private void validatePrices(Double regularPrice, Double vipPercent) {
        if (regularPrice == null || regularPrice <= 0) {
            throw new InvalidInputException("Đơn giá vé ghế thường phải > 0 VNĐ");
        }
        if (vipPercent == null || vipPercent < 0) {
            throw new InvalidInputException("Phần trăm ghế VIP không được âm");
        }
    }

    private List<Combo> getCombosFromIds(List<String> comboIds) {
        if (comboIds != null && !comboIds.isEmpty()) {
            return comboRepository.findAllById(comboIds);
        }
        return Collections.emptyList();
    }

    private ShowtimeResponse mapToResponse(Showtime showtime) {
        Film movie = showtime.getMovie();
        ScreeningRoom room = showtime.getRoom();

        String movieCategoryName = movie.getCategory() != null ? movie.getCategory().getName() : "";

        ResponseMovie movieRecord = new ResponseMovie(
                movie.getId(), movie.getTitle(), movie.getDuration(), movie.getPosterUrl(),
                movieCategoryName
        );

        ResponseScreeningRoom roomRecord = new ResponseScreeningRoom(
                room.getId(), room.getTenPhong(), room.getSoLuongGheThuong(),
                room.getSoLuongGheVip(), room.getSoHangGhe(), room.getSoCotGhe(),
                room.getTongSoGhe(), room.getCoLoiDi(), room.getSeatLayout()
        );

        List<ComboResponse> comboResponses = (showtime.getCombos() != null)
                ? showtime.getCombos().stream().map(comboService::mapToResponse).toList()
                : Collections.emptyList();

        return new ShowtimeResponse(
                showtime.getId(), movieRecord, roomRecord, showtime.getShowDate(),
                showtime.getStartTime(), showtime.getEndTime(), showtime.getRegularPrice(),
                showtime.getVipPercent(), showtime.getVipPrice(), showtime.getStatus(),
                comboResponses
        );
    }
}