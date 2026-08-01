package com.example.ticketgo.repository;
import com.example.ticketgo.entity.TicketConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketConfigRepository extends JpaRepository<TicketConfig, String> {
}
