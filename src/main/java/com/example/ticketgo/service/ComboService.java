package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.ComboCreateRequest;
import com.example.ticketgo.dto.response.ComboResponse;
import com.example.ticketgo.entity.Combo;
import com.example.ticketgo.entity.ComboDrink;
import com.example.ticketgo.entity.Product;
import com.example.ticketgo.exception.InvalidInputException;
import com.example.ticketgo.exception.ResourceNotFoundException;
import com.example.ticketgo.repository.ComboRepository;
import com.example.ticketgo.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComboService {

    private final ComboRepository comboRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    @Transactional
    public ComboResponse createCombo(ComboCreateRequest request) {
        // 1. Tìm thông tin Bắp
        Product popcorn = productRepository.findById(request.getPopcornId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm bắp với ID: " + request.getPopcornId()));

        if (!"POPCORN".equalsIgnoreCase(popcorn.getType())) {
            throw new InvalidInputException("Sản phẩm được chọn không phải loại Bắp");
        }

        int popcornQty = (request.getPopcornQuantity() != null && request.getPopcornQuantity() > 0)
                ? request.getPopcornQuantity() : 1;

        // 2. Tìm danh sách Nước và ghép số lượng
        List<String> drinkIds = request.getDrinks().stream()
                .map(ComboCreateRequest.ComboDrinkItem::getProductId)
                .toList();

        List<Product> drinkProducts = productRepository.findAllById(drinkIds);
        if (drinkProducts.isEmpty()) {
            throw new InvalidInputException("Vui lòng chọn ít nhất 1 loại nước cho Combo");
        }

        Map<String, Product> productMap = drinkProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        List<ComboDrink> comboDrinks = new ArrayList<>();
        double calculatedDrinkPrice = 0.0;

        for (ComboCreateRequest.ComboDrinkItem item : request.getDrinks()) {
            Product drinkProduct = productMap.get(item.getProductId());
            if (drinkProduct != null) {
                int drinkQty = (item.getQuantity() != null && item.getQuantity() > 0) ? item.getQuantity() : 1;

                comboDrinks.add(ComboDrink.builder()
                        .product(drinkProduct)
                        .quantity(drinkQty)
                        .build());

                calculatedDrinkPrice += drinkProduct.getSellPrice() * drinkQty;
            }
        }

        // 3. Ưu tiên lấy Giá Combo thủ công do FE gửi lên, nếu không có mới tự động tính
        double totalPrice = (request.getComboPrice() != null && request.getComboPrice() > 0)
                ? request.getComboPrice()
                : (popcorn.getSellPrice() * popcornQty) + calculatedDrinkPrice;

        // 4. Lưu Combo
        Combo combo = Combo.builder()
                .name(request.getName().trim())
                .popcorn(popcorn)
                .popcornQuantity(popcornQty)
                .drinks(comboDrinks)
                .totalPrice(totalPrice)
                .build();

        Combo saved = comboRepository.save(combo);
        return mapToResponse(saved);
    }
    @Transactional
    public void deleteCombo(String id) {
        if (!comboRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Combo với ID: " + id);
        }
        comboRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ComboResponse> getAllCombos() {
        return comboRepository.findAllWithDetails()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ComboResponse mapToResponse(Combo combo) {
        List<ComboResponse.ComboDrinkResponse> drinkResponses = combo.getDrinks().stream()
                .map(d -> ComboResponse.ComboDrinkResponse.builder()
                        .product(productService.mapToResponse(d.getProduct()))
                        .quantity(d.getQuantity())
                        .build())
                .toList();

        return ComboResponse.builder()
                .id(combo.getId())
                .name(combo.getName())
                .popcorn(productService.mapToResponse(combo.getPopcorn()))
                .popcornQuantity(combo.getPopcornQuantity())
                .drinks(drinkResponses)
                .totalPrice(combo.getTotalPrice())
                .build();
    }
}