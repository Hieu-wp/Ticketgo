package com.example.ticketgo.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ComboResponse {
    private String id;
    private String name;
    private ProductResponse popcorn;
    private List<ProductResponse> drinks;
    private Double totalPrice;
}