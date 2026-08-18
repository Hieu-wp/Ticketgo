package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.LoginRequest;
import com.example.ticketgo.dto.request.RegisterRequest;
import com.example.ticketgo.dto.response.AuthResponse;
import com.example.ticketgo.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {

        // Xác thực thủ công qua AuthService (so sánh mật khẩu băm bằng passwordEncoder)
        AuthResponse authResponse = authService.login(request);

        // Tự tạo Authentication và lưu vào SecurityContext + session
        // (không dùng AuthenticationManager để tránh lỗi StackOverflowError)
        List<SimpleGrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority(authResponse.getRole()));

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                authResponse.getUsername(), null, authorities);

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        securityContextRepository.saveContext(securityContext, httpRequest, httpResponse);

        return ResponseEntity.ok(authResponse);
    }

    // API Đăng ký
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        return ResponseEntity.ok(authResponse);
    }
}