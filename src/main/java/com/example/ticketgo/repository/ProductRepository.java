package com.example.ticketgo.repository;


import com.example.ticketgo.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    // Tìm sản phẩm theo loại (VD: 'POPCORN' hoặc 'DRINK')
    List<Product> findByType(String type);
}