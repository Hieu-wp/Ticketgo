package com.example.ticketgo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(length = 10, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    private String role;

    @PrePersist
    public void generateId() {
        if (this.id == null) {

            this.id = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        }
    }
}