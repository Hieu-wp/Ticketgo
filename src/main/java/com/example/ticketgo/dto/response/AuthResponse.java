package com.example.ticketgo.dto.response;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {

    private String message;
    private String userId;      // Mã 10 ký tự vừa tạo ở Bước 2
    private String username;
    private String role;
}
