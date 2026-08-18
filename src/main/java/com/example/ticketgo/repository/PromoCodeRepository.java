package com.example.ticketgo.repository;

import com.example.ticketgo.entity.PromoCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, String> {

    // 1. Kiểm tra tồn tại mã (Dùng cho Validate khi Tạo mới)
    boolean existsByCode(String code);

    // 2. Kiểm tra tồn tại mã ngoại trừ ID hiện tại (Dùng cho Validate khi Cập nhật)
    boolean existsByCodeAndIdNot(String code, String id);

    // 3. Tìm theo Mã giảm giá
    Optional<PromoCode> findByCode(String code);

    // 4. Tìm kiếm từ khóa + Lọc theo Trạng thái + Phân trang
    @Query("SELECT p FROM PromoCode p WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            " LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (" +
            " :status = 'all' OR " +
            " (:status = 'active' AND p.isActive = true AND p.startDate <= CURRENT_DATE AND p.endDate >= CURRENT_DATE AND p.usedCount < p.usageLimit) OR " +
            " (:status = 'upcoming' AND p.isActive = true AND p.startDate > CURRENT_DATE) OR " +
            " (:status = 'expired' AND (p.isActive = false OR p.endDate < CURRENT_DATE OR p.usedCount >= p.usageLimit))" +
            ")")
    Page<PromoCode> findByFilter(
            @Param("keyword") String keyword,
            @Param("status") String status,
            Pageable pageable
    );
}