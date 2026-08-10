package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Random;

@Entity
@Table(
        name = "tickets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_showtime_seat", columnNames = {"showtime_id", "seat_code"}),
                @UniqueConstraint(name = "uk_showtime_ticket_code", columnNames = {"showtime_id", "ticket_code"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "ticket_code", length = 10, nullable = false)
    private String ticketCode;

    @Column(name = "showtime_id", length = 50, nullable = false)
    private String showtimeId;

    @Column(name = "seat_code", nullable = false, length = 10)
    private String seatNumber;

    // Loại ghế tại thời điểm bán: NORMAL hoặc VIP
    @Column(name = "seat_type", length = 20, nullable = false)
    @Builder.Default
    private String seatType = "NORMAL";

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "customer_id", length = 50)
    private String customerId;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "HOLDING";

    // Nguồn tạo vé: ONLINE hoặc COUNTER
    @Column(name = "source", length = 20, nullable = false)
    @Builder.Default
    private String source = "ONLINE";

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = true)
    private Booking booking;

    @PrePersist
    public void prePersist() {
        if (this.id == null || this.id.isEmpty()) {
            this.id = "TK-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
        if (this.ticketCode == null || this.ticketCode.isEmpty()) {
            this.ticketCode = generateShortCode(5);
        }
    }

    private String generateShortCode(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new SecureRandom();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}