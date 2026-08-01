package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Film;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilmRepository extends JpaRepository<Film, String> {
    // Thêm hàm này để ép Spring Data JPA luôn sắp xếp phim theo ID tăng dần
    List<Film> findAllByOrderByIdAsc();
}