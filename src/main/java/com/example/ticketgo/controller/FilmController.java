package com.example.ticketgo.controller;

import com.example.ticketgo.entity.Film;
import com.example.ticketgo.repository.FilmRepository;
import com.example.ticketgo.service.FilmService;
import com.example.ticketgo.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class FilmController {

    private final FilmService filmService;
    private final FilmRepository filmRepository;
    private final StorageService storageService;

    @GetMapping("/")
    public String index(Model model) {
        List<Film> listPhim = filmService.getAllFilms();
        model.addAttribute("films", listPhim);
        return "quanliphim";
    }

    @GetMapping("/view")
    public String showScreeningRoomPage() {
        return "ScreeningRoom";
    }

    @PostMapping("/films/add")
    public String addFilm(@ModelAttribute Film film,
                          @RequestParam(value = "filePoster", required = false) MultipartFile filePoster,
                          @RequestParam(value = "fileBanner", required = false) MultipartFile fileBanner) {

        // 1. Tạo ID ngẫu nhiên nếu form không truyền ID
        if (film.getId() == null || film.getId().isBlank()) {
            film.setId("FILM_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        // 2. Xử lý Upload Poster lên Supabase Storage (Lưu URL https://... vào DB)
        // Sửa link fallback thành placehold.co
        film.setPosterUrl(handleUpload(filePoster, "posters", "https://placehold.co/300x450/png?text=No+Poster"));
        film.setBannerUrl(handleUpload(fileBanner, "banners", "https://placehold.co/800x450/png?text=No+Banner"));

        // 4. Lưu xuống Database
        filmRepository.save(film);

        return "redirect:/";
    }

    @PostMapping("/films/edit")
    @ResponseBody
    public ResponseEntity<?> editFilm(@ModelAttribute Film film,
                                      @RequestParam(value = "filePoster", required = false) MultipartFile filePoster,
                                      @RequestParam(value = "fileBanner", required = false) MultipartFile fileBanner) {

        // 1. Kiểm tra ID truyền lên
        if (film.getId() == null || film.getId().isBlank()) {
            return ResponseEntity.badRequest().body("ID phim không được để trống!");
        }

        Film existingFilm = filmRepository.findById(film.getId()).orElse(null);

        if (existingFilm == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phim cần sửa!");
        }

        // 2. Xử lý poster (Nếu chọn file mới thì upload lên thư mục 'posters', nếu không thì giữ URL cũ)
        film.setPosterUrl(handleUpload(filePoster, "posters", existingFilm.getPosterUrl()));

        // 3. Xử lý banner (Nếu chọn file mới thì upload lên thư mục 'banners', nếu không thì giữ URL cũ)
        film.setBannerUrl(handleUpload(fileBanner, "banners", existingFilm.getBannerUrl()));

        try {
            filmRepository.save(film);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi lưu database: " + e.getMessage());
        }
    }

    // --- Hàm dùng chung để upload file lên Supabase Storage
    private String handleUpload(MultipartFile file, String folder, String fallbackUrl) {
        // Nếu không gửi file mới hoặc file rỗng thì giữ nguyên URL cũ/fallback
        if (file == null || file.isEmpty()) {
            return fallbackUrl;
        }
        try {
            // Tải ảnh mới lên Supabase và nhận về Public URL HTTPS đầy đủ
            return storageService.uploadFile(file, folder);
        } catch (Exception e) {
            e.printStackTrace();
            // Nếu upload lỗi thì fallback về URL cũ để tránh mất ảnh cũ trong DB
            return fallbackUrl;
        }
    }
}