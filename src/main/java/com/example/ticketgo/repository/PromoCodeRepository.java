package com.example.ticketgo.repository;

import com.example.ticketgo.entity.PromoCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, String> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, String id);

    Optional<PromoCode> findByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PromoCode p WHERE UPPER(p.code) = UPPER(:code)")
    Optional<PromoCode> findByCodeForUpdate(@Param("code") String code);

    @Query("SELECT p FROM PromoCode p WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            " LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (" +
            " :status = 'all' OR " +
            " (:status = 'active' AND p.isActive = true " +
            "AND p.startDate <= CURRENT_DATE " +
            "AND p.endDate >= CURRENT_DATE " +
            "AND COALESCE(p.usedCount, 0) < p.usageLimit) OR " +
            " (:status = 'upcoming' AND p.isActive = true " +
            "AND p.startDate > CURRENT_DATE) OR " +
            " (:status = 'expired' AND " +
            "(p.isActive = false OR p.endDate < CURRENT_DATE " +
            "OR COALESCE(p.usedCount, 0) >= p.usageLimit))" +
            ")")
    Page<PromoCode> findByFilter(
            @Param("keyword") String keyword,
            @Param("status") String status,
            Pageable pageable
    );
}