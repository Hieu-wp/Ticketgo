package com.example.ticketgo.controller;


import com.example.ticketgo.dto.request.ProductCreateRequest;
import com.example.ticketgo.dto.response.ProductResponse;
import com.example.ticketgo.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProductController {

    private final ProductService productService;

    // GET /api/products (Hỗ trợ lấy tất cả hoặc lọc theo type)
    @GetMapping
    public ResponseEntity<?> getProducts(@RequestParam(required = false) String type) {
        List<ProductResponse> products;
        if (type != null && !type.isBlank()) {
            products = productService.getProductsByType(type);
        } else {
            products = productService.getAllProducts();
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", products
        ));
    }

    // POST /api/products
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thêm sản phẩm thành công!",
                "data", response
        ));
    }
}