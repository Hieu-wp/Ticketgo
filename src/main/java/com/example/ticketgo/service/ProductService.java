package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.ProductCreateRequest;
import com.example.ticketgo.dto.response.ProductResponse;
import com.example.ticketgo.entity.Product;
import com.example.ticketgo.exception.InvalidInputException;
import com.example.ticketgo.exception.ResourceNotFoundException;
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
        Double actualPrice = request.getCostPrice();
        if (actualPrice == null) actualPrice = request.getSellPrice();
        if (actualPrice == null) actualPrice = request.getPrice();

        if (actualPrice == null || actualPrice < 0) {
            throw new InvalidInputException("Giá sản phẩm không hợp lệ!");
        }

        Integer qty = (request.getQuantity() != null && request.getQuantity() >= 0) ? request.getQuantity() : 0;

        String name = request.getName().trim();
        String type = request.getType().toUpperCase();

        // Kiểm tra trùng tên trong cùng loại (Bắp/Nước)
        if (productRepository.existsByNameIgnoreCaseAndType(name, type)) {
            String typeLabel = type.equals("POPCORN") ? "Bắp" : "Nước";
            throw new InvalidInputException(typeLabel + " \"" + name + "\" đã tồn tại!");
        }

        Product product = Product.builder()
                .name(name)
                .type(type)
                .costPrice(actualPrice)
                .sellPrice(actualPrice)
                .quantity(qty)
                .build();

        Product saved = productRepository.save(product);
        return mapToResponse(saved);
    }

    // Bổ sung phương thức xóa sản phẩm
    @Transactional
    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id);
        }
        productRepository.deleteById(id);
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
                .quantity(product.getQuantity())
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