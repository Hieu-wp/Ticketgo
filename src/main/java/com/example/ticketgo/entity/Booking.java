package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings", schema = "public", uniqueConstraints = {
        @UniqueConstraint(name = "bookings_code_date_unique", columnNames = {"booking_code", "booking_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @Column(name = "id", length = 5, nullable = false)
    private String id;

    // Mã vé do hàm generate_booking_code() dưới DB tự sinh khi insert (không cho Hibernate ghi giá trị này)
    @Column(name = "booking_code", length = 10, nullable = false, insertable = false, updatable = false)
    private String bookingCode;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_id")
    private Combo combo;

    @Column(name = "selected_drinks", columnDefinition = "TEXT")
    private String selectedDrinks;

    @Column(name = "selected_popcorns", columnDefinition = "TEXT")
    private String selectedPopcorns;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Ticket> tickets = new ArrayList<>();

    @Column(name = "guest_name", length = 100)
    private String guestName;

    @PrePersist
    protected void onCreate() {
        // FIX: id không có @GeneratedValue và không insertable=false -> Hibernate sẽ insert NULL
        // nếu không tự sinh ở đây, vi phạm ràng buộc NOT NULL của cột id.
        if (this.id == null || this.id.isEmpty()) {
            this.id = generateShortCode(5);
        }
        if (this.bookingDate == null) {
            this.bookingDate = LocalDate.now();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.paymentMethod == null) {
            this.paymentMethod = "COUNTER";
        }
        if (this.status == null) {
            this.status = "PAID";
        }
    }

    private String generateShortCode(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public void addTicket(Ticket ticket) {
        tickets.add(ticket);
        ticket.setBooking(this);
    }
}