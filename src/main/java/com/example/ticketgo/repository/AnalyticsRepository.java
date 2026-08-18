package com.example.ticketgo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<com.example.ticketgo.entity.Booking, String> {

    // 1. KPI Summary
    @Query(value = """
    SELECT 
        COALESCE(SUM(b.total_amount), 0) AS totalRevenue,
        (SELECT COUNT(t.id) 
           FROM tickets t 
           JOIN bookings b_sub ON t.booking_id = b_sub.id 
           JOIN showtimes s_sub ON b_sub.showtime_id = s_sub.id
           WHERE b_sub.status = 'PAID' 
             AND t.status IN ('VALID', 'SOLD', 'USED')
             AND b_sub.booking_date BETWEEN :startDate AND :endDate
             AND (:roomId = 'all' OR CAST(s_sub.room_id AS VARCHAR) = :roomId)
             AND (:movieId = 'all' OR CAST(s_sub.movie_id AS VARCHAR) = :movieId)) AS ticketsSold,
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
             AND (:roomId = 'all' OR CAST(s3.room_id AS VARCHAR) = :roomId)
             AND (:movieId = 'all' OR CAST(s3.movie_id AS VARCHAR) = :movieId)) AS comboRevenue,
        (SELECT COUNT(*)
           FROM showtimes s4
           WHERE s4.show_date BETWEEN :startDate AND :endDate
             AND (:roomId = 'all' OR CAST(s4.room_id AS VARCHAR) = :roomId)
             AND (:movieId = 'all' OR CAST(s4.movie_id AS VARCHAR) = :movieId)) AS totalShows
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    WHERE b.status = 'PAID'
      AND b.booking_date BETWEEN :startDate AND :endDate
      AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
      AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
""", nativeQuery = true)
    List<Object[]> getKpiSummary(@Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate,
                                 @Param("roomId") String roomId,
                                 @Param("movieId") String movieId);

    // 2. Doanh thu theo ngày
    @Query(value = """
        SELECT 
            TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS date,
            COALESCE(SUM(b.total_amount), 0) AS totalAmount
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
          AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
        GROUP BY TO_CHAR(b.booking_date, 'YYYY-MM-DD')
        ORDER BY date ASC
    """, nativeQuery = true)
    List<Object[]> getDailyRevenue(@Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate,
                                   @Param("roomId") String roomId,
                                   @Param("movieId") String movieId);

    // 2b. Doanh thu theo giờ
    @Query(value = """
    SELECT 
        TO_CHAR(s.start_time, 'HH24:00') AS date,
        COALESCE(SUM(b.total_amount), 0) AS totalAmount
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    WHERE b.status = 'PAID'
      AND b.booking_date BETWEEN :startDate AND :endDate
      AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
      AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
    GROUP BY TO_CHAR(s.start_time, 'HH24:00')
    ORDER BY date ASC
""", nativeQuery = true)
    List<Object[]> getHourlyRevenue(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("roomId") String roomId,
                                    @Param("movieId") String movieId);

    // 3. Tỷ lệ doanh thu theo Phim
    @Query(value = """
        SELECT 
            m.title AS label,
            COALESCE(SUM(b.total_amount), 0) AS value
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        WHERE b.status = 'PAID'
          AND b.booking_date BETWEEN :startDate AND :endDate
          AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
        GROUP BY m.id, m.title
        ORDER BY value DESC
    """, nativeQuery = true)
    List<Object[]> getMovieRevenueRatio(@Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate,
                                        @Param("roomId") String roomId);

    // 4. Khung giờ bán vé
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
          AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
          AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
        GROUP BY TO_CHAR(s.start_time, 'HH24:00')
        ORDER BY timeSlot ASC
    """, nativeQuery = true)
    List<Object[]> getHourlyTickets(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("roomId") String roomId,
                                    @Param("movieId") String movieId);

    // 5. Tỷ lệ loại ghế
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
          AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
          AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
        GROUP BY t.seat_type
    """, nativeQuery = true)
    List<Object[]> getSeatTypeRatio(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("roomId") String roomId,
                                    @Param("movieId") String movieId);

    // 6. Top Combo
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

    // 7. Top Phim
    @Query(value = """
        SELECT 
            m.id AS id,
            m.title AS title,
            (SELECT COUNT(t.id) 
               FROM tickets t 
               JOIN showtimes s2 ON t.showtime_id = s2.id 
               JOIN bookings b2 ON t.booking_id = b2.id
               WHERE s2.movie_id = m.id 
                 AND b2.status = 'PAID' 
                 AND t.status IN ('VALID', 'SOLD', 'USED') 
                 AND b2.booking_date BETWEEN :startDate AND :endDate) AS ticketsSold,
            COALESCE(SUM(b.total_amount), 0) AS totalRevenue
        FROM movies m
        JOIN showtimes s ON s.movie_id = m.id
        JOIN bookings b ON b.showtime_id = s.id AND b.status = 'PAID' AND b.booking_date BETWEEN :startDate AND :endDate
        GROUP BY m.id, m.title
        ORDER BY totalRevenue DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Object[]> getTopMovies(@Param("startDate") LocalDate startDate,
                                @Param("endDate") LocalDate endDate);

    // 8. Hiệu suất Phòng
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

    // 9. Giao dịch gần đây
    @Query(value = """
        SELECT 
            b.booking_code AS code,
            TO_CHAR(b.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM') AS time,
            COALESCE(c.name, b.guest_name, 'Khách vãng lai') AS customer,
            m.title AS movie,
            b.total_amount AS total
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.status = 'PAID' 
          AND (
               b.booking_date BETWEEN :startDate AND :endDate 
               OR CAST(b.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS DATE) BETWEEN :startDate AND :endDate
          )
          AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
          AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
        ORDER BY b.created_at DESC
        LIMIT 20
    """, nativeQuery = true)
    List<Object[]> getRecentTransactions(@Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate,
                                         @Param("roomId") String roomId,
                                         @Param("movieId") String movieId);

    // 10. Suất chiếu sắp tới
    @Query(value = """
        SELECT 
            CONCAT(TO_CHAR(s.show_date, 'DD/MM'), ' ', TO_CHAR(s.start_time, 'HH24:MI')) AS time,
            m.title AS movie,
            sr.ten_phong AS room,
            COUNT(t.id) AS sold,
            sr.tong_so_ghe AS total
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        JOIN screening_room sr ON s.room_id = sr.id
        LEFT JOIN tickets t ON t.showtime_id = s.id AND t.status IN ('VALID', 'SOLD', 'USED')
        WHERE s.show_date >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' AS DATE)
          AND (:roomId = 'all' OR CAST(s.room_id AS VARCHAR) = :roomId)
          AND (:movieId = 'all' OR CAST(s.movie_id AS VARCHAR) = :movieId)
        GROUP BY s.id, s.show_date, s.start_time, m.title, sr.ten_phong, sr.tong_so_ghe
        ORDER BY s.show_date ASC, s.start_time ASC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> getUpcomingShowtimes(@Param("roomId") String roomId,
                                        @Param("movieId") String movieId);
}