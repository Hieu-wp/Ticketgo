package com.example.ticketgo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Bắt các lỗi nghiệp vụ ném ra từ AuthService
    // (VD: "Tài khoản hoặc mật khẩu không chính xác", "Tên đăng nhập đã tồn tại!")
    // Trả về JSON { "message": "..." } với status 400 thay vì lỗi 500 mặc định.
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }
}