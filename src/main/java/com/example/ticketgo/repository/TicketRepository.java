package com.example.ticketgo.repository;

import com.example.ticketgo.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {
    void deleteByShowtimeId(String showtimeId);
}