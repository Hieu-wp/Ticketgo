package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, String> {

    List<Showtime> findByStatus(String status);

    // Lấy danh sách suất chiếu không bị ẩn dành riêng cho App khách hàng
    List<Showtime> findByStatusNot(String status);

    // Kiểm tra trùng lịch khi THÊM MỚI
    @Query("SELECT COUNT(s) > 0 FROM Showtime s WHERE s.room.id = :roomId " +
            "AND s.showDate = :showDate " +
            "AND ((s.startTime < :endTime AND s.endTime > :startTime))")
    boolean existsOverlappingShowtime(
            @Param("roomId") String roomId,
            @Param("showDate") LocalDate showDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Kiểm tra trùng lịch khi CẬP NHẬT (Loại trừ ID của suất chiếu hiện tại)
    @Query("SELECT COUNT(s) > 0 FROM Showtime s WHERE s.room.id = :roomId " +
            "AND s.showDate = :showDate " +
            "AND s.id <> :excludeId " +
            "AND ((s.startTime < :endTime AND s.endTime > :startTime))")
    boolean existsOverlappingShowtimeExcludingId(
            @Param("roomId") String roomId,
            @Param("showDate") LocalDate showDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") String excludeId
    );
}