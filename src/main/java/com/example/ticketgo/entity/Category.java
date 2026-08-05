package com.example.ticketgo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories", schema = "public")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@DynamicInsert //  Bỏ qua các field null để PostgreSQL tự chạy DEFAULT generate_short_id()
public class Category {

    @Id
    @Column(name = "id", length = 5, updatable = false)
    private String id;

    @Column(name = "name", nullable = false, length = 40)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "count", nullable = false)
    @Builder.Default
    private Integer count = 0;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "active"; // Giữ chữ viết thường theo CHECK constraint của SQL

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "age_rating_id")
    @ToString.Exclude
    @JsonIgnore // Bỏ qua khi serialize JSON để tránh lỗi 500 do Lazy Loading
    private AgeRating ageRating;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}