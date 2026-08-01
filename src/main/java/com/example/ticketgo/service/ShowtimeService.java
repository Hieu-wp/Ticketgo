package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.ShowtimeRequest;
import com.example.ticketgo.dto.SlotDto;
import com.example.ticketgo.entity.Film;
import com.example.ticketgo.entity.ScreeningRoom;
import com.example.ticketgo.entity.ScreeningSlot;
import com.example.ticketgo.entity.Showtime;
import com.example.ticketgo.repository.FilmRepository;
import com.example.ticketgo.repository.ScreeningRoomRepository;
import com.example.ticketgo.repository.ScreeningSlotRepository;
import com.example.ticketgo.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final FilmRepository movieRepository;
    private final ScreeningRoomRepository screeningRoomRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ScreeningSlotRepository screeningSlotRepository;

    // ==========================================================
    // 1. TẠO LỊCH CHIẾU VÀ CÁC SUẤT CHIẾU CON (SLOTS)
    // ==========================================================
    @Transactional
    public void createShowtime(ShowtimeRequest request) {

        // 1.1 Kiểm tra null request và phim
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu gửi lên không được rỗng!");
        }
        if (request.getPhimId() == null || request.getPhimId().isBlank()) {
            throw new IllegalArgumentException("Vui lòng chọn phim áp dụng!");
        }

        Film movie = movieRepository.findById((request.getPhimId()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phim trong hệ thống!"));

        // 1.2 Kiểm tra logic ngày tháng
        boolean isRepeat = Boolean.TRUE.equals(request.getLapLaiHangNgay());
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        LocalDate startDate = isRepeat ? request.getNgayBatDau() : request.getSingleDate();
        LocalDate endDate = isRepeat ? request.getNgayKetThuc() : request.getSingleDate();

        if (startDate == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày áp dụng!");
        }

        // Không được chọn ngày trong quá khứ
        if (startDate.isBefore(today)) {
            throw new IllegalArgumentException("Ngày bắt đầu chiếu không được là ngày trong quá khứ!");
        }

        if (isRepeat) {
            if (endDate == null) {
                throw new IllegalArgumentException("Vui lòng chọn ngày kết thúc chuỗi chiếu!");
            }
            if (endDate.isBefore(startDate)) {
                throw new IllegalArgumentException("Ngày kết thúc chuỗi phải lớn hơn hoặc bằng ngày bắt đầu!");
            }
        }

        // 1.3 Kiểm tra số ca chiếu
        List<SlotDto> slots = request.getSlots();
        if (slots == null || slots.isEmpty()) {
            throw new IllegalArgumentException("Danh sách ca chiếu không được để trống!");
        }
        if (request.getSoSuatTrongNgay() == null || request.getSoSuatTrongNgay() <= 0) {
            throw new IllegalArgumentException("Số suất chiếu trong ngày phải lớn hơn 0!");
        }

        // 1.4 Kiểm tra chi tiết từng Ca Chiếu (Slot)
        boolean isSingleDateToday = (!isRepeat && startDate.equals(today));

        for (int i = 0; i < slots.size(); i++) {
            SlotDto slot = slots.get(i);
            int slotNumber = i + 1;

            if (slot.getPhongId() == null || slot.getPhongId().isBlank()) {
                throw new IllegalArgumentException("Chưa chọn phòng chiếu cho ca thứ #" + slotNumber);
            }
            if (slot.getGioBatDau() == null) {
                throw new IllegalArgumentException("Chưa chọn giờ bắt đầu cho ca thứ #" + slotNumber);
            }

            // Nếu chỉ chiếu 1 ngày VÀ ngày đó là HÔM NAY -> Giờ chiếu phải lớn hơn hoặc bằng giờ hiện tại
            if (isSingleDateToday && slot.getGioBatDau().isBefore(now)) {
                throw new IllegalArgumentException(
                        String.format("Ca thứ #%d (%s) không được nhỏ hơn giờ hiện tại (%s) do ngày chiếu là hôm nay!",
                                slotNumber, slot.getGioBatDau(), now.toString().substring(0, 5))
                );
            }
        }

        // 2. THỰC HIỆN LƯU DATABASE KHI DỮ LIỆU ĐÃ HỢP LỆ
        Showtime showtime = new Showtime();
        showtime.setMovie(movie);
        showtime.setLapLaiHangNgay(isRepeat);
        showtime.setNgayBatDau(startDate);
        showtime.setNgayKetThuc(endDate);
        showtime.setSoSuatTrongNgay(slots.size());

        Showtime savedShowtime = showtimeRepository.save(showtime);

        List<ScreeningSlot> slotsToSave = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            for (SlotDto slotDto : slots) {
                // Do ID của ScreeningRoom là String nên truyền trực tiếp slotDto.getPhongId()
                ScreeningRoom room = screeningRoomRepository.findById(slotDto.getPhongId())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chiếu id: " + slotDto.getPhongId()));

                ScreeningSlot slot = new ScreeningSlot();
                slot.setShowtime(savedShowtime);
                slot.setRoom(room);
                slot.setGioBatDau(slotDto.getGioBatDau());
                slot.setNgayChieu(currentDate);

                slotsToSave.add(slot);
            }
            currentDate = currentDate.plusDays(1);
        }

        screeningSlotRepository.saveAll(slotsToSave);
    }

    // ==========================================================
    // 2. LẤY TẤT CẢ DỮ LIỆU SUẤT CHIẾU CHO FRONTEND
    // ==========================================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllShowtimes() {
        List<ScreeningSlot> slots = screeningSlotRepository.findAll();
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (ScreeningSlot slot : slots) {
            Map<String, Object> map = new HashMap<>();

            // ID suất chiếu
            map.put("id", String.valueOf(slot.getId()));

            // Thông tin Phim (sử dụng getTenFilm() và getThoiLuong())
            Film movie = (slot.getShowtime() != null) ? slot.getShowtime().getMovie() : null;
            if (movie != null) {
                map.put("movieId", String.valueOf(movie.getId()));
                map.put("movie", movie.getTitle());
                map.put("duration", movie.getDuration());
            } else {
                map.put("movieId", "");
                map.put("movie", "[ Chưa gán tên phim ]");
                map.put("duration", 0);
            }

            // Thông tin Phòng (sử dụng getTenPhong() và getTongSoGhe())
            ScreeningRoom room = slot.getRoom();
            map.put("room", room != null ? room.getTenPhong() : "Chưa chọn phòng");
            map.put("totalSeats", (room != null && room.getTongSoGhe() != null) ? room.getTongSoGhe() : 0);

            // Thời gian & Ngày chiếu
            map.put("date", slot.getNgayChieu() != null ? slot.getNgayChieu().toString() : "");
            map.put("time", slot.getGioBatDau() != null ? slot.getGioBatDau().toString().substring(0, 5) : "");

            // Trạng thái gán vé (Mặc định)
            map.put("isAssigned", false);
            map.put("ticketsSold", 0);

            responseList.add(map);
        }

        return responseList;
    }


    // 3. XÓA SUẤT CHIẾU THEO ID

    @Transactional
    public void deleteShowtime(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cần xóa không hợp lệ!");
        }

        // Kiểm tra xem ID truyền lên là của ScreeningSlot (ca chiếu lẻ)
        if (screeningSlotRepository.existsById(String.valueOf(id))) {
            screeningSlotRepository.deleteById(String.valueOf(id));
            return;
        }

        // Hoặc nếu ID truyền lên là của Showtime mẹ (chuỗi ca chiếu)
        if (showtimeRepository.existsById(String.valueOf(id))) {
            showtimeRepository.deleteById(String.valueOf(id));
            return;
        }

        throw new IllegalArgumentException("Không tìm thấy ca chiếu hoặc lịch chiếu có ID: " + id);
    }
}