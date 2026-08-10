package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "customers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_customer_phone", columnNames = "phone")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @Column(name = "id", length = 10)
    private String id;

    @PrePersist
    public void generateShortId() {
        if (this.id == null || this.id.isEmpty()) {
            if (this.phone != null && !this.phone.trim().isEmpty()) {
                // Sinh id CỐ ĐỊNH dựa trên số điện thoại -> cùng 1 SĐT luôn ra cùng 1 id
                this.id = generateIdFromPhone(this.phone.trim());
            } else {
                // Không có SĐT -> vẫn sinh ngẫu nhiên như cũ (khách vãng lai không để lại thông tin)
                this.id = java.util.UUID.randomUUID().toString().substring(0, 8);
            }
        }
    }

    private String generateIdFromPhone(String phone) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(phone.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.substring(0, 8).toUpperCase();
        } catch (Exception e) {
            return java.util.UUID.randomUUID().toString().substring(0, 8);
        }
    }

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}