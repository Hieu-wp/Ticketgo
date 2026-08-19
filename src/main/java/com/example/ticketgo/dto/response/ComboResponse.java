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
    private Integer popcornQuantity;
    private List<ComboDrinkResponse> drinks;
    private Double totalPrice;

    @Data
    @Builder
    public static class ComboDrinkResponse {
        private ProductResponse product;
        private Integer quantity;
    }
}