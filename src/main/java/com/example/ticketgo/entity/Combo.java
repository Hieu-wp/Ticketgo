package com.example.ticketgo.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "combos", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Combo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    // Liên kết đến 1 Sản phẩm loại Bắp
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "popcorn_id")
    private Product popcorn;

    // Liên kết đến danh sách Sản phẩm loại Nước qua bảng trung gian combo_drinks
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "combo_drinks",
            schema = "public",
            joinColumns = @JoinColumn(name = "combo_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    @Builder.Default
    private List<Product> drinks = new ArrayList<>();

    @Column(name = "total_price", nullable = false)
    @Builder.Default
    private Double totalPrice = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}