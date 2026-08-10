package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, String> {

    //  LUỒNG ĐẶT VÉ

    // Lấy suất chiếu kèm theo thông tin Room và Movie (Dùng JOIN FETCH để tối ưu hiệu năng)
    @Query("SELECT s FROM Showtime s JOIN FETCH s.room JOIN FETCH s.movie WHERE s.id = :id")
    Optional<Showtime> findByIdWithDetails(@Param("id") String id);

    // Lấy danh sách suất chiếu theo ID Phim (phục vụ lấy suất chiếu khi chọn phim tại quầy)
    @Query("SELECT s FROM Showtime s JOIN FETCH s.room WHERE s.movie.id = :movieId ORDER BY s.showDate ASC, s.startTime ASC")
    List<Showtime> findByMovieId(@Param("movieId") String movieId);

    // Lấy danh sách suất chiếu của Phim theo Ngày (dùng cho Online/App client)
    @Query("SELECT s FROM Showtime s JOIN FETCH s.room WHERE s.movie.id = :movieId AND s.showDate = :showDate AND s.status <> 'HIDDEN' ORDER BY s.startTime ASC")
    List<Showtime> findByMovieIdAndShowDate(
            @Param("movieId") String movieId,
            @Param("showDate") LocalDate showDate
    );

    // các phương thức kiểm tra trùng lịch chiếu

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