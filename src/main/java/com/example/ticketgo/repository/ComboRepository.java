package com.example.ticketgo.repository;



import com.example.ticketgo.entity.Combo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComboRepository extends JpaRepository<Combo, String> {

    // Tải thông tin Combo cùng với danh sách Nước để tránh lỗi LazyInitializationException
    @Query("SELECT DISTINCT c FROM Combo c LEFT JOIN FETCH c.drinks LEFT JOIN FETCH c.popcorn WHERE c.id = :id")
    Optional<Combo> findByIdWithDetails(@Param("id") String id);

    // Lấy toàn bộ danh sách Combo kèm chi tiết bắp nước
    @Query("SELECT DISTINCT c FROM Combo c LEFT JOIN FETCH c.drinks LEFT JOIN FETCH c.popcorn ORDER BY c.createdAt DESC")
    List<Combo> findAllWithDetails();
}
