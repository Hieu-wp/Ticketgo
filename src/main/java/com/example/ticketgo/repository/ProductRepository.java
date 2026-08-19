package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    List<Product> findByType(String type);

    boolean existsByNameIgnoreCaseAndType(
            String name,
            String type
    );

    Optional<Product> findByNameIgnoreCaseAndType(
            String name,
            String type
    );

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM combo_drinks cd
                WHERE cd.combo_id = :comboId
                  AND cd.product_id = :productId
            )
            """, nativeQuery = true)
    boolean existsDrinkInCombo(
            @Param("comboId") String comboId,
            @Param("productId") String productId
    );
}