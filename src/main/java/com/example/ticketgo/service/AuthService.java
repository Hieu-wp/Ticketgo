package com.example.ticketgo.service;

import com.example.ticketgo.dto.response.AuthResponse;
import com.example.ticketgo.dto.request.LoginRequest;
import com.example.ticketgo.dto.request.RegisterRequest;
import com.example.ticketgo.entity.User;
import com.example.ticketgo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Logic Đăng ký: Băm mật khẩu và lưu User
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword())) // Băm mật khẩu ở đây
                .role("ROLE_USER")
                .build();

        User savedUser = userRepository.save(user);

        return AuthResponse.builder()
                .message("Đăng ký tài khoản thành công")
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .build();
    }

    // Logic Đăng nhập: So sánh mật khẩu băm
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Tài khoản hoặc mật khẩu không chính xác"));

        // passwordEncoder.matches(Mật khẩu thô, Chuỗi mã hóa trong DB)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Tài khoản hoặc mật khẩu không chính xác");
        }

        return AuthResponse.builder()
                .message("Đăng nhập thành công")
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }
}