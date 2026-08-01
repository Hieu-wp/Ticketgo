package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.RequestScreeningRoom;
import com.example.ticketgo.dto.response.ResponseScreeningRoom;
import com.example.ticketgo.entity.ScreeningRoom;
import com.example.ticketgo.repository.ScreeningRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreeningRoomService {

    private final ScreeningRoomRepository screeningRoomRepository;

    // Tạo mới phòng chiếu kèm sơ đồ ghế dạng JSON
    @Transactional
    public ResponseScreeningRoom createScreeningRoom(RequestScreeningRoom request) {
        if (screeningRoomRepository.existsByTenPhong(request.tenPhong())) {
            throw new IllegalArgumentException("Tên phòng chiếu đã tồn tại!");
        }

        ScreeningRoom room = ScreeningRoom.builder()
                .tenPhong(request.tenPhong())
                .soLuongGheThuong(request.soLuongGheThuong())
                .soLuongGheVip(request.soLuongGheVip())
                .soHangGhe(request.soHangGhe())
                .soCotGhe(request.soCotGhe())
                .coLoiDi(request.coLoiDi())
                .tongSoGhe(request.soLuongGheThuong() + request.soLuongGheVip())
                .seatLayout(request.seatLayout())
                .build();

        ScreeningRoom savedRoom = screeningRoomRepository.save(room);
        return mapToResponse(savedRoom);
    }

    // Lấy thông tin chi tiết một phòng chiếu theo ID
    @Transactional(readOnly = true)
    public ResponseScreeningRoom getScreeningRoomById(String id) {
        ScreeningRoom screeningRoom = screeningRoomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu với ID: " + id));
        return mapToResponse(screeningRoom);
    }

    // Lấy danh sách toàn bộ phòng chiếu trong hệ thống
    @Transactional(readOnly = true)
    public List<ResponseScreeningRoom> getAllScreeningRooms() {
        return screeningRoomRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Cập nhật thông tin phòng chiếu và sơ đồ ghế mới
    @Transactional
    public ResponseScreeningRoom updateScreeningRoom(String id, RequestScreeningRoom request) {
        ScreeningRoom room = screeningRoomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));

        room.setTenPhong(request.tenPhong());
        room.setSoHangGhe(request.soHangGhe());
        room.setSoCotGhe(request.soCotGhe());
        room.setSoLuongGheThuong(request.soLuongGheThuong());
        room.setSoLuongGheVip(request.soLuongGheVip());
        room.setTongSoGhe(request.soLuongGheThuong() + request.soLuongGheVip());
        room.setCoLoiDi(request.coLoiDi());
        room.setSeatLayout(request.seatLayout());

        ScreeningRoom updated = screeningRoomRepository.save(room);
        return mapToResponse(updated);
    }

    // Xóa phòng chiếu khỏi hệ thống theo ID
    @Transactional
    public void deleteScreeningRoom(String id) {
        if (!screeningRoomRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy phòng chiếu để xóa với ID: " + id);
        }
        screeningRoomRepository.deleteById(id);
    }

    // Chuyển đổi dữ liệu từ Entity ScreeningRoom sang DTO ResponseScreeningRoom
    private ResponseScreeningRoom mapToResponse(ScreeningRoom room) {
        return new ResponseScreeningRoom(
                room.getId(),
                room.getTenPhong(),
                room.getSoLuongGheThuong(),
                room.getSoLuongGheVip(),
                room.getSoHangGhe(),
                room.getSoCotGhe(),
                room.getTongSoGhe(),
                room.getCoLoiDi(),
                room.getSeatLayout()
        );
    }
}