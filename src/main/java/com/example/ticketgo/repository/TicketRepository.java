package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {

    // 1. Lấy danh sách vé theo bookingId (Mô hình Booking 1 - N Ticket)
    List<Ticket> findByBookingId(String bookingId);

    // 2. Lấy toàn bộ vé thuộc một suất chiếu
    List<Ticket> findByShowtimeId(String showtimeId);
    int countByShowtimeId(String showtimeId);
    // 3. Xóa tất cả vé theo showtimeId
    void deleteByShowtimeId(String showtimeId);

    // 4. Lấy danh sách vé có hiệu lực của suất chiếu (Đã bán/thanh toán/sử dụng hoặc đang giữ chỗ)
    @Query("""
        SELECT t FROM Ticket t 
        WHERE t.showtimeId = :showtimeId 
        AND (
            t.status IN ('VALID', 'SOLD', 'USED') 
            OR (t.status = 'HOLDING' AND t.holdExpiresAt > :now)
        )
    """)
    List<Ticket> findActiveTicketsByShowtime(
            @Param("showtimeId") String showtimeId,
            @Param("now") LocalDateTime now
    );

    // 5a. Kiểm tra ghế trùng theo tên tham số seatNumbers (Dùng cho CounterBookingService)
    @Query("""
        SELECT t.seatNumber FROM Ticket t 
        WHERE t.showtimeId = :showtimeId 
        AND t.seatNumber IN :seatNumbers 
        AND (
            t.status IN ('VALID', 'SOLD', 'USED') 
            OR (t.status = 'HOLDING' AND t.holdExpiresAt > :now)
        )
    """)
    List<String> findOccupiedSeatNumbers(
            @Param("showtimeId") String showtimeId,
            @Param("seatNumbers") List<String> seatNumbers,
            @Param("now") LocalDateTime now
    );

    // 5b. Kiểm tra ghế trùng theo tên tham số seatCodes (Dùng cho BookingService)
    @Query("""
        SELECT t.seatNumber FROM Ticket t 
        WHERE t.showtimeId = :showtimeId 
        AND t.seatNumber IN :seatCodes 
        AND (
            t.status IN ('VALID', 'SOLD', 'USED') 
            OR (t.status = 'HOLDING' AND t.holdExpiresAt > :now)
        )
    """)
    List<String> findOccupiedSeatCodes(
            @Param("showtimeId") String showtimeId,
            @Param("seatCodes") List<String> seatCodes,
            @Param("now") LocalDateTime now
    );

    // 6. Xóa các vé giữ chỗ Online đã quá hạn
    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.status = 'HOLDING' AND t.holdExpiresAt <= :now")
    int deleteExpiredHoldingTickets(@Param("now") LocalDateTime now);

    // Thêm truy vấn tìm vé linh hoạt theo Mã vé hoặc Mã đặt chỗ (Booking Code)
    @Query("""
    SELECT t FROM Ticket t 
    LEFT JOIN t.booking b 
    WHERE t.id = :code 
       OR t.ticketCode = :code 
       OR b.bookingCode = :code
""")
    List<Ticket> findByAnyCode(@Param("code") String code);
}