package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "products", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // "POPCORN", "DRINK"

    @Column(name = "cost_price", nullable = false)
    @Builder.Default
    private Double costPrice = 0.0;

    @Column(name = "sell_price", nullable = false)
    @Builder.Default
    private Double sellPrice = 0.0;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}