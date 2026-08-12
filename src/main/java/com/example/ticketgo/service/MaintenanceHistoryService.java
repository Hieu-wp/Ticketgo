package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.RequestMaintenance;
import com.example.ticketgo.dto.response.MaintenanceHistoryResponse;
import com.example.ticketgo.entity.MaintenanceHistory;
import com.example.ticketgo.entity.ScreeningRoom;
import com.example.ticketgo.repository.MaintenanceHistoryRepository;
import com.example.ticketgo.repository.ScreeningRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceHistoryService {

    private final MaintenanceHistoryRepository maintenanceHistoryRepository;
    private final ScreeningRoomRepository screeningRoomRepository;
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    // Lấy thông tin phiếu đang bảo trì để nạp lên Form khi nhấn "Hoàn tất"
    @Transactional(readOnly = true)
    public MaintenanceHistoryResponse getActiveMaintenanceByRoomId(String roomId) {
        MaintenanceHistory history = maintenanceHistoryRepository
                .findFirstByScreeningRoom_IdAndTrangThaiOrderByNgayBatDauDesc(roomId, "Đang thực hiện")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu bảo trì đang hoạt động"));
        return mapToResponse(history);
    }

    // Tự động điều hướng Bắt đầu hoặc Hoàn tất
    @Transactional
    public void handleMaintenance(String roomId, RequestMaintenance request) {
        ScreeningRoom room = screeningRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));

        // Tìm phiếu bảo trì ĐANG THỰC HIỆN của phòng này
        var activeHistoryOpt = maintenanceHistoryRepository
                .findFirstByScreeningRoom_IdAndTrangThaiOrderByNgayBatDauDesc(roomId, "Đang thực hiện");

        if (activeHistoryOpt.isPresent()) {
            // 1. NẾU ĐÃ CÓ PHIẾU ĐANG BẢO TRÌ -> CẬP NHẬT CHÍNH PHIẾU ĐÓ THÀNH HOÀN THÀNH
            MaintenanceHistory history = activeHistoryOpt.get();
            history.setNgayKetThuc(LocalDateTime.now());
            history.setTrangThai("Hoàn thành");
            if (request.chiPhi() != null) history.setChiPhi(request.chiPhi());
            if (request.ghiChu() != null) history.setGhiChu(request.ghiChu());

            maintenanceHistoryRepository.save(history);

            // Đổi trạng thái phòng về HOAT_DONG
            room.setTrangThai("HOAT_DONG");
            screeningRoomRepository.save(room);
        } else {
            // 2. NẾU CHƯA CÓ PHIẾU NÀO -> TẠO MỚI PHIẾU BẢO TRÌ
            MaintenanceHistory history = MaintenanceHistory.builder()
                    .screeningRoom(room)
                    .ngayBatDau(LocalDateTime.now())
                    .loaiBaoTri(request.loaiBaoTri())
                    .nguoiThucHien(request.nguoiThucHien())
                    .trangThai("Đang thực hiện")
                    .chiPhi(request.chiPhi())
                    .moTa(request.moTa())
                    .ghiChu(request.ghiChu())
                    .build();

            maintenanceHistoryRepository.save(history);

            room.setTrangThai("BAO_TRI");
            screeningRoomRepository.save(room);
        }
    }

    @Transactional
    public void startMaintenance(String roomId, RequestMaintenance request) {
        ScreeningRoom room = screeningRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));

        MaintenanceHistory history = MaintenanceHistory.builder()
                .screeningRoom(room)
                .ngayBatDau(LocalDateTime.now()) // Tự lấy giờ hiện tại hệ thống
                .loaiBaoTri(request.loaiBaoTri())
                .nguoiThucHien(request.nguoiThucHien())
                .trangThai("Đang thực hiện")
                .chiPhi(request.chiPhi())
                .moTa(request.moTa())
                .ghiChu(request.ghiChu())
                .build();

        maintenanceHistoryRepository.save(history);

        room.setTrangThai("BAO_TRI");
        screeningRoomRepository.save(room);
    }

    @Transactional
    public void completeMaintenance(String historyId, RequestMaintenance request) {
        MaintenanceHistory history = maintenanceHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi bảo trì"));

        history.setNgayKetThuc(LocalDateTime.now()); // Tự lấy giờ hoàn tất
        history.setTrangThai("Hoàn thành");
        if (request.chiPhi() != null) history.setChiPhi(request.chiPhi());
        if (request.ghiChu() != null) history.setGhiChu(request.ghiChu());

        maintenanceHistoryRepository.save(history);

        // Chuyển phòng về HOAT_DONG (Xóa trạng thái Đang bảo trì trên Card phòng)
        ScreeningRoom room = history.getScreeningRoom();
        if (room != null) {
            room.setTrangThai("HOAT_DONG");
            screeningRoomRepository.save(room);
        }
    }

    @Transactional(readOnly = true)
    public List<MaintenanceHistoryResponse> filterHistory(String tenPhong, String trangThai, String loaiBaoTri) {
        return maintenanceHistoryRepository.filterHistory(tenPhong, trangThai, loaiBaoTri)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private MaintenanceHistoryResponse mapToResponse(MaintenanceHistory history) {
        return MaintenanceHistoryResponse.builder()
                .id(history.getId())
                .tenPhong(history.getScreeningRoom() != null ? history.getScreeningRoom().getTenPhong() : "N/A")
                .trangThai(history.getTrangThai())
                .loaiBaoTri(history.getLoaiBaoTri())
                // Thay DATE_FORMATTER thành DATETIME_FORMATTER
                .ngayBatDau(history.getNgayBatDau() != null ? history.getNgayBatDau().format(DATETIME_FORMATTER) : null)
                .ngayKetThuc(history.getNgayKetThuc() != null ? history.getNgayKetThuc().format(DATETIME_FORMATTER) : null)
                .nguoiThucHien(history.getNguoiThucHien())
                .chiPhi(history.getChiPhi())
                .moTa(history.getMoTa())
                .ghiChu(history.getGhiChu())
                .build();
    }
}