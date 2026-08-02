package com.example.ticketgo.service;



import com.example.ticketgo.dto.request.ComboCreateRequest;
import com.example.ticketgo.dto.response.ComboResponse;
import com.example.ticketgo.entity.Combo;
import com.example.ticketgo.entity.Product;
import com.example.ticketgo.exception.InvalidInputException;
import com.example.ticketgo.exception.ResourceNotFoundException;
import com.example.ticketgo.repository.ComboRepository;
import com.example.ticketgo.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

        // 2. Tìm danh sách Nước
        List<Product> drinks = productRepository.findAllById(request.getDrinkIds());
        if (drinks.isEmpty()) {
            throw new InvalidInputException("Vui lòng chọn ít nhất 1 loại nước cho Combo");
        }

        // 3. Tính giá tự động: Giá Bắp + Giá Nước đắt nhất
        double maxDrinkPrice = drinks.stream()
                .mapToDouble(Product::getSellPrice)
                .max()
                .orElse(0.0);

        double totalPrice = popcorn.getSellPrice() + maxDrinkPrice;

        // 4. Lưu Combo
        Combo combo = Combo.builder()
                .name(request.getName().trim())
                .popcorn(popcorn)
                .drinks(drinks)
                .totalPrice(totalPrice)
                .build();

        Combo saved = comboRepository.save(combo);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ComboResponse> getAllCombos() {
        return comboRepository.findAllWithDetails()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ComboResponse mapToResponse(Combo combo) {
        return ComboResponse.builder()
                .id(combo.getId())
                .name(combo.getName())
                .popcorn(productService.mapToResponse(combo.getPopcorn()))
                .drinks(combo.getDrinks().stream().map(productService::mapToResponse).toList())
                .totalPrice(combo.getTotalPrice())
                .build();
    }
}