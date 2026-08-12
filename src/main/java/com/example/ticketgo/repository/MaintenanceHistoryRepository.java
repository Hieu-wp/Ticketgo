package com.example.ticketgo.repository;

import com.example.ticketgo.entity.MaintenanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceHistoryRepository extends JpaRepository<MaintenanceHistory, String> {

    @Query("SELECT m FROM MaintenanceHistory m WHERE " +
            "(:tenPhong IS NULL OR :tenPhong = '' OR m.screeningRoom.tenPhong = :tenPhong) AND " +
            "(:trangThai IS NULL OR :trangThai = '' OR m.trangThai = :trangThai) AND " +
            "(:loaiBaoTri IS NULL OR :loaiBaoTri = '' OR m.loaiBaoTri = :loaiBaoTri) " +
            "ORDER BY m.id DESC")
    List<MaintenanceHistory> filterHistory(
            @Param("tenPhong") String tenPhong,
            @Param("trangThai") String trangThai,
            @Param("loaiBaoTri") String loaiBaoTri
    );

    Optional<MaintenanceHistory> findFirstByScreeningRoom_IdAndTrangThaiOrderByNgayBatDauDesc(String roomId, String trangThai);
}