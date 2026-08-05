package com.example.ticketgo.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private String id;
    private String name;
    private String description;
    private Integer count;
    private String status;
    private String ageRatingId;
    private String ageRatingCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    public Integer getMovieCount() {
        return this.count;
    }
}