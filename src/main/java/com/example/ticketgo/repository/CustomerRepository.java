package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    @Query("SELECT c FROM Customer c WHERE :keyword IS NULL " +
            "OR LOWER(c.name) LIKE :keyword " +
            "OR LOWER(c.phone) LIKE :keyword")
    Page<Customer> searchCustomers(@Param("keyword") String keyword, Pageable pageable);
    // Tìm kiếm khách hàng theo số điện thoại để tái sử dụng thông tin
    Optional<Customer> findByPhone(String phone);
    boolean existsByPhone(String phone);
}