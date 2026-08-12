package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.RequestMaintenance;
import com.example.ticketgo.dto.request.RequestScreeningRoom;
import com.example.ticketgo.dto.response.ResponseScreeningRoom;
import com.example.ticketgo.entity.MaintenanceHistory;
import com.example.ticketgo.entity.ScreeningRoom;
import com.example.ticketgo.repository.MaintenanceHistoryRepository;
import com.example.ticketgo.repository.ScreeningRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreeningRoomService {

    private final ScreeningRoomRepository screeningRoomRepository;
    // Bổ sung Repository lưu lịch sử bảo trì
    private final MaintenanceHistoryRepository maintenanceHistoryRepository;

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
                .trangThai("HOAT_DONG") // Gán mặc định khi tạo mới
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

    // Xử lý logic Bảo Trì Phòng Chiếu
    @Transactional
    public void handleMaintenance(String roomId, RequestMaintenance request) {
        // 1. Kiểm tra ngoại lệ ngày bắt đầu nhỏ hơn ngày hiện tại
        if (request.ngayBatDau() == null || request.ngayBatDau().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Ngày bắt đầu bảo trì không được nhỏ hơn ngày hiện tại!");
        }

        // 2. Kiểm tra ngày kết thúc (nếu có) không được trước ngày bắt đầu
        if (request.ngayKetThuc() != null && request.ngayKetThuc().isBefore(request.ngayBatDau())) {
            throw new IllegalArgumentException("Ngày kết thúc dự kiến không được trước ngày bắt đầu!");
        }

        // 3. Tìm phòng chiếu theo ID
        ScreeningRoom room = screeningRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu với ID: " + roomId));

        // 4. Tạo và lưu bản ghi Lịch sử bảo trì
        MaintenanceHistory history = MaintenanceHistory.builder()
                .screeningRoom(room)
                .ngayBatDau(request.ngayBatDau())
                .ngayKetThuc(request.ngayKetThuc())
                .loaiBaoTri(request.loaiBaoTri())
                .nguoiThucHien(request.nguoiThucHien())
                .trangThai(request.trangThaiHoSo())
                .chiPhi(request.chiPhi())
                .moTa(request.moTa())
                .ghiChu(request.ghiChu())
                .build();
        maintenanceHistoryRepository.save(history);

        // 5. Cập nhật trạng thái hiển thị của Phòng chiếu
        if ("Hoàn thành".equalsIgnoreCase(request.trangThaiHoSo())) {
            room.setTrangThai("HOAT_DONG");
        } else {
            room.setTrangThai("BAO_TRI");
        }
        screeningRoomRepository.save(room);
    }

    // Chuyển đổi dữ liệu từ Entity ScreeningRoom sang DTO ResponseScreeningRoom
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
                room.getTrangThai(),
                room.getSeatLayout()
        );
    }
}