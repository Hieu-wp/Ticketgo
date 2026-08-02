package com.example.ticketgo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductResponse {
    private String id;
    private String name;
    private String type;
    private Double costPrice;
    private Double sellPrice;
}
