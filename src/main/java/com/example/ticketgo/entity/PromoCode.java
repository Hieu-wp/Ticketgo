package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "promo_codes", schema = "public")
public class PromoCode {

    @Id
    @Column(length = 10, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "discount_type", nullable = false, length = 10)
    private String discountType;

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    @Column(name = "max_discount")
    private BigDecimal maxDiscount;

    @Column(name = "min_order", nullable = false)
    private BigDecimal minOrder;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "usage_limit", nullable = false)
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "customer_type")
    private String customerType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    // Tự động sinh ID 10 ký tự chữ và số ngẫu nhiên trước khi lưu vào DB
    @PrePersist
    public void generateId() {
        if (this.id == null || this.id.trim().isEmpty()) {
            this.id = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        }
    }

    // Trả về trạng thái thực tế phục vụ render giao diện
    @Transient
    public String getStatus() {
        if (!Boolean.TRUE.equals(isActive)) return "expired";
        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) return "upcoming";
        if (today.isAfter(endDate) || (usageLimit != null && usedCount >= usageLimit)) return "expired";
        return "active";
    }
}