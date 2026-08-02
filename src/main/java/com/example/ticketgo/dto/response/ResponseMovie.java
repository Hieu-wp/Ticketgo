package com.example.ticketgo.dto.response;


public record ResponseMovie(
        String id,
        String title,
        Integer duration,
        String posterUrl
) {}
