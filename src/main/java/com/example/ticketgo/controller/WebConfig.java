package com.example.ticketgo.controller;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Lấy đường dẫn tuyệt đối đến thư mục chứa ảnh bên ngoài
        String uploadPosixPath = Paths.get("uploads").toAbsolutePath().toUri().toString();

        // Cấu hình: Khi gọi đường dẫn /uploads/** thì Spring sẽ tự tìm trong thư mục ngoài
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPosixPath);
    }
}