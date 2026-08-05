package com.example.ticketgo.repository;

import com.example.ticketgo.entity.AgeRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgeRatingRepository extends JpaRepository<AgeRating, String> {


    Optional<AgeRating> findByCode(String code);


    boolean existsByCode(String code);
}
