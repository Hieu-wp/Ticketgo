package com.example.ticketgo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Đã bỏ bean AuthenticationManager (authConfig.getAuthenticationManager())
    // vì AuthService tự xử lý xác thực bằng passwordEncoder.matches(),
    // không cần AuthenticationManager -> tránh lỗi StackOverflowError.

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Tắt triệt để CSRF và CORS
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)

                // Lưu session đăng nhập
                .securityContext(context -> context
                        .securityContextRepository(securityContextRepository())
                )

                // Mở quyền hoàn toàn cho tất cả request bắt đầu bằng /api/auth/
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/login", "/css/**", "/js/**", "/images/**", "/webjars/**", "/favicon.ico", "/error").permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}