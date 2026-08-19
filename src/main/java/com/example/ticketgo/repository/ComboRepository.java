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

    @Query("SELECT DISTINCT c FROM Combo c LEFT JOIN FETCH c.drinks d LEFT JOIN FETCH d.product LEFT JOIN FETCH c.popcorn WHERE c.id = :id")
    Optional<Combo> findByIdWithDetails(@Param("id") String id);

    @Query("SELECT DISTINCT c FROM Combo c LEFT JOIN FETCH c.drinks d LEFT JOIN FETCH d.product LEFT JOIN FETCH c.popcorn ORDER BY c.createdAt DESC")
    List<Combo> findAllWithDetails();
}