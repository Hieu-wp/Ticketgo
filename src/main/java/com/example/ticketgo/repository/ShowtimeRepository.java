package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShowtimeRepository extends JpaRepository<Showtime, String> {}