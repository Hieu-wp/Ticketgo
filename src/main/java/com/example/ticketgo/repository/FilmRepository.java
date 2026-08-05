package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Film;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilmRepository extends JpaRepository<Film, String> {
    List<Film> findAllByOrderByIdAsc();

    List<Film> findByCategoryId(String categoryId);
    int countByCategoryId(String categoryId);


}