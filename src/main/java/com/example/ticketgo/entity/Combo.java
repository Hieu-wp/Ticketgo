package com.example.ticketgo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "combos", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Combo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "popcorn_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product popcorn;

    @Column(name = "popcorn_quantity", nullable = false)
    @Builder.Default
    private Integer popcornQuantity = 1;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "combo_drinks",
            schema = "public",
            joinColumns = @JoinColumn(name = "combo_id")
    )
    @Builder.Default
    private List<ComboDrink> drinks = new ArrayList<>();

    @Column(name = "total_price", nullable = false)
    @Builder.Default
    private Double totalPrice = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Tự động tạo trường JSON "items" gửi về Client
     * Giúp hàm getComboItems() phía Frontend nhận đúng danh sách Bắp & Nước
     */
    @Transient
    @JsonProperty("items")
    public List<Map<String, Object>> getItems() {
        List<Map<String, Object>> itemsList = new ArrayList<>();

        if (this.popcorn != null) {
            Map<String, Object> popcornItem = new HashMap<>();
            popcornItem.put("id", this.popcorn.getId());
            popcornItem.put("name", this.popcorn.getName());
            popcornItem.put("type", "POPCORN");
            popcornItem.put("quantity", this.popcornQuantity != null ? this.popcornQuantity : 1);
            itemsList.add(popcornItem);
        }

        if (this.drinks != null && !this.drinks.isEmpty()) {
            for (ComboDrink drink : this.drinks) {
                Map<String, Object> drinkItem = new HashMap<>();
                if (drink.getProduct() != null) {
                    drinkItem.put("id", drink.getProduct().getId());
                    drinkItem.put("name", drink.getProduct().getName());
                }
                drinkItem.put("type", "DRINK");
                drinkItem.put("quantity", drink.getQuantity() != null ? drink.getQuantity() : 1);
                itemsList.add(drinkItem);
            }
        }

        return itemsList;
    }
}