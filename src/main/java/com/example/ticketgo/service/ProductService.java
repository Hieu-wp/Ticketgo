package com.example.ticketgo.service;



import com.example.ticketgo.dto.request.ProductCreateRequest;
import com.example.ticketgo.dto.response.ProductResponse;
import com.example.ticketgo.entity.Product;
import com.example.ticketgo.exception.InvalidInputException;
import com.example.ticketgo.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        // 1. Kiểm tra giá không được âm
        if (request.getCostPrice() == null || request.getCostPrice() < 0) {
            throw new InvalidInputException("Giá nhập sản phẩm không được nhỏ hơn 0 VNĐ");
        }
        if (request.getSellPrice() == null || request.getSellPrice() < 0) {
            throw new InvalidInputException("Giá bán sản phẩm không được nhỏ hơn 0 VNĐ");
        }

        Product product = Product.builder()
                .name(request.getName().trim())
                .type(request.getType().toUpperCase())
                .costPrice(request.getCostPrice())
                .sellPrice(request.getSellPrice())
                .build();

        Product saved = productRepository.save(product);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByType(String type) {
        return productRepository.findByType(type.toUpperCase())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .type(product.getType())
                .costPrice(product.getCostPrice())
                .sellPrice(product.getSellPrice())
                .build();
    }
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
}