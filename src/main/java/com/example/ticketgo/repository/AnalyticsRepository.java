package com.example.ticketgo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<com.example.ticketgo.entity.Booking, String> {

    // 1. Thống kê tổng quan (KPI Summary) - Cột index 4 đếm số Phim đang có suất chiếu
    @Query(value = """
    SELECT 
        COALESCE(SUM(b.total_amount), 0) AS totalRevenue,
        COUNT(DISTINCT t.id) AS ticketsSold,
        COUNT(DISTINCT b.customer_id) AS totalCustomers,
        COUNT(DISTINCT b.id) AS totalBookings,
        (SELECT COUNT(DISTINCT s2.movie_id) 
           FROM showtimes s2 
           WHERE s2.show_date >= CURRENT_DATE) AS activeMovies,
        (SELECT COALESCE(SUM(c.total_price), 0)
           FROM bookings b2
           JOIN showtimes s3 ON b2.showtime_id = s3.id
           JOIN combos c ON b2.combo_id = c.id
           WHERE b2.status = 'PAID'
             AND b2.combo_id IS NOT NULL
             AND b2.booking_date BETWEEN :startDate AND :endDate
             AND (:roomId IS NULL OR s3.room_id = :roomId)
             AND (:movieId IS NULL OR s3.movie_id = :movieId)) AS comboRevenue,
        (SELECT COUNT(*)
           FROM showtimes s4
           WHERE s4.show_date BETWEEN :startDate AND :endDate
             AND (:roomId IS NULL OR s4.room_id = :roomId)
             AND (:movieId IS NULL OR s4.movie_id = :movieId)) AS totalShows
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    LEFT JOIN tickets t ON t.booking_id = b.id AND t.status IN ('VALID', 'SOLD', 'USED')
    WHERE b.status = 'PAID'
      AND b.booking_date BETWEEN :startDate AND :endDate
      AND (:roomId IS NULL OR s.room_id = :roomId)
      AND (:movieId IS NULL OR s.movie_id = :movieId)
""", nativeQuery = true)
    List<Object[]> getKpiSummary(@Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate,
                                 @Param("roomId") String roomId,
                                 @Param("movieId") String movieId);

    // 2. Biểu đồ Doanh thu theo ngày
    @Query(value = """
        SELECT 
            TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS date,
            COALESCE(SUM(b.total_amount), 0) AS totalAmount
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND (:roomId IS NULL OR s.room_id = :roomId)
          AND (:movieId IS NULL OR s.movie_id = :movieId)
        GROUP BY b.booking_date
        ORDER BY b.booking_date ASC
    """, nativeQuery = true)
    List<Object[]> getDailyRevenue(@Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate,
                                   @Param("roomId") String roomId,
                                   @Param("movieId") String movieId);

    // 2b. Biểu đồ Doanh thu theo GIỜ (dùng riêng cho period = 1d/today)
    @Query(value = """
    SELECT 
        TO_CHAR(s.start_time, 'HH24:00') AS date,
        COALESCE(SUM(b.total_amount), 0) AS totalAmount
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    WHERE b.status = 'PAID'
      AND b.booking_date BETWEEN :startDate AND :endDate
      AND (:roomId IS NULL OR s.room_id = :roomId)
      AND (:movieId IS NULL OR s.movie_id = :movieId)
    GROUP BY TO_CHAR(s.start_time, 'HH24:00')
    ORDER BY date ASC
""", nativeQuery = true)
    List<Object[]> getHourlyRevenue(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("roomId") String roomId,
                                    @Param("movieId") String movieId);

    // 3. Biểu đồ Tỷ lệ doanh thu theo Phim
    @Query(value = """
        SELECT 
            m.title AS label,
            COALESCE(SUM(b.total_amount), 0) AS value
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND (:roomId IS NULL OR s.room_id = :roomId)
        GROUP BY m.id, m.title
        ORDER BY value DESC
    """, nativeQuery = true)
    List<Object[]> getMovieRevenueRatio(@Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate,
                                        @Param("roomId") String roomId);

    // 4. Biểu đồ Khung giờ bán vé chạy nhất
    @Query(value = """
        SELECT 
            TO_CHAR(s.start_time, 'HH24:00') AS timeSlot,
            COUNT(t.id) AS ticketCount
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        JOIN showtimes s ON t.showtime_id = s.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND t.status IN ('VALID', 'SOLD', 'USED')
          AND (:roomId IS NULL OR s.room_id = :roomId)
          AND (:movieId IS NULL OR s.movie_id = :movieId)
        GROUP BY TO_CHAR(s.start_time, 'HH24:00')
        ORDER BY timeSlot ASC
    """, nativeQuery = true)
    List<Object[]> getHourlyTickets(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("roomId") String roomId,
                                    @Param("movieId") String movieId);

    // 5. Biểu đồ Tỷ lệ loại ghế (THUONG vs VIP)
    @Query(value = """
        SELECT 
            t.seat_type AS label,
            COUNT(t.id) AS value
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        JOIN showtimes s ON t.showtime_id = s.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND t.status IN ('VALID', 'SOLD', 'USED')
          AND (:roomId IS NULL OR s.room_id = :roomId)
          AND (:movieId IS NULL OR s.movie_id = :movieId)
        GROUP BY t.seat_type
    """, nativeQuery = true)
    List<Object[]> getSeatTypeRatio(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("roomId") String roomId,
                                    @Param("movieId") String movieId);

    // 6. Biểu đồ Top Combo đồ ăn/thức uống
    @Query(value = """
        SELECT 
            c.name AS comboName,
            COUNT(b.id) AS quantity
        FROM bookings b
        JOIN combos c ON b.combo_id = c.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND b.combo_id IS NOT NULL
        GROUP BY c.id, c.name
        ORDER BY quantity DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Object[]> getTopCombos(@Param("startDate") LocalDate startDate,
                                @Param("endDate") LocalDate endDate);

    // 7. Bảng Top Phim Doanh Thu
    @Query(value = """
        SELECT 
            m.id AS id,
            m.title AS title,
            COUNT(DISTINCT t.id) AS ticketsSold,
            COALESCE(SUM(b.total_amount), 0) AS totalRevenue
        FROM movies m
        JOIN showtimes s ON s.movie_id = m.id
        JOIN bookings b ON b.showtime_id = s.id AND b.status = 'PAID' AND b.booking_date BETWEEN :startDate AND :endDate
        LEFT JOIN tickets t ON t.booking_id = b.id AND t.status IN ('VALID', 'SOLD', 'USED')
        GROUP BY m.id, m.title
        ORDER BY totalRevenue DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Object[]> getTopMovies(@Param("startDate") LocalDate startDate,
                                @Param("endDate") LocalDate endDate);

    // 8. Bảng Hiệu suất Phòng Chiếu (Đã sửa screening_room, ten_phong, tong_so_ghe)
    @Query(value = """
        SELECT 
            sr.id AS roomId,
            sr.ten_phong AS roomName,
            sr.tong_so_ghe AS totalSeats,
            (SELECT COUNT(*) FROM showtimes s WHERE s.room_id = sr.id AND s.show_date BETWEEN :startDate AND :endDate) AS totalShows,
            (SELECT COUNT(*) FROM tickets t JOIN showtimes s ON t.showtime_id = s.id WHERE s.room_id = sr.id AND s.show_date BETWEEN :startDate AND :endDate AND t.status IN ('VALID', 'SOLD', 'USED')) AS ticketsSold,
            COALESCE((SELECT SUM(b.total_amount) FROM bookings b JOIN showtimes s ON b.showtime_id = s.id WHERE s.room_id = sr.id AND b.booking_date BETWEEN :startDate AND :endDate AND b.status = 'PAID'), 0) AS totalRevenue
        FROM screening_room sr
        ORDER BY totalRevenue DESC
    """, nativeQuery = true)
    List<Object[]> getRoomDetails(@Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);

    // 9. Bảng Giao dịch gần đây (Đã sửa c.name)
    @Query(value = """
        SELECT 
            b.booking_code AS code,
            TO_CHAR(b.created_at, 'HH24:MI DD/MM') AS time,
            COALESCE(c.name, b.guest_name, 'Khách vãng lai') AS customer,
            m.title AS movie,
            b.total_amount AS total
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.status = 'PAID' AND b.booking_date = CURRENT_DATE
        ORDER BY b.created_at DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> getRecentTransactions();

    // 10. Bảng Suất chiếu sắp tới
    @Query(value = """
        SELECT 
            TO_CHAR(s.start_time, 'HH24:MI') AS time,
            m.title AS movie,
            sr.ten_phong AS room,
            COUNT(t.id) AS sold,
            sr.tong_so_ghe AS total
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        JOIN screening_room sr ON s.room_id = sr.id
        LEFT JOIN tickets t ON t.showtime_id = s.id AND t.status IN ('VALID', 'SOLD', 'USED')
        WHERE s.show_date = CURRENT_DATE
          AND s.start_time >= CURRENT_TIME
        GROUP BY s.id, s.start_time, m.title, sr.ten_phong, sr.tong_so_ghe
        ORDER BY s.start_time ASC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> getUpcomingShowtimes();
}