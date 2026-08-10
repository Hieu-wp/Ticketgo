package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    // Tra cứu mã vé 5 ký tự theo ngày đặt
    Optional<Booking> findByBookingCodeAndBookingDate(String bookingCode, LocalDate bookingDate);

    // Tra cứu linh hoạt: theo Booking ID hoặc (Mã code 5 ký tự + Ngày hôm nay)
    @Query("SELECT b FROM Booking b WHERE b.id = :query OR (b.bookingCode = :query AND b.bookingDate = :today)")
    Optional<Booking> findByIdOrCodeToday(@Param("query") String query, @Param("today") LocalDate today);

    // Lấy lịch sử giao dịch của khách hàng, sắp xếp mới nhất lên đầu

    @Query("SELECT DISTINCT b FROM Booking b " +
            "JOIN FETCH b.showtime s " +
            "JOIN FETCH s.movie m " +
            "JOIN FETCH s.room r " +
            "LEFT JOIN FETCH b.tickets t " +
            "WHERE b.customer.id = :customerId " +
            "ORDER BY b.createdAt DESC")
    List<Booking> findTransactionHistoryByCustomerId(@Param("customerId") String customerId);
}