package com.example.ticketgo.controller;

import com.example.ticketgo.dto.response.ResponseMovie;
import com.example.ticketgo.entity.Film;
import com.example.ticketgo.repository.CategoryRepository;
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

import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class FilmController {

    private final FilmService filmService;
    private final FilmRepository filmRepository;
    private final CategoryRepository categoryRepository;
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
                          @RequestParam(value = "category_id", required = false) String categoryId,
                          @RequestParam(value = "filePoster", required = false) MultipartFile filePoster,
                          @RequestParam(value = "fileBanner", required = false) MultipartFile fileBanner) {

        if (film.getId() == null || film.getId().isBlank()) {
            film.setId("FILM_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        if (categoryId != null && !categoryId.isBlank()) {
            categoryRepository.findById(categoryId).ifPresent(category -> {
                film.setCategory(category);

                if (film.getGenre() == null || film.getGenre().isBlank()) {
                    film.setGenre(category.getName());
                }
            });
        }

        if (film.getGenre() == null || film.getGenre().isBlank()) {
            film.setGenre("Chưa phân loại");
        }

        if (film.getAgeRating() == null || film.getAgeRating().isBlank()) {
            film.setAgeRating("P");
        }

        // Upload Poster & Banner
        String defaultPoster = "https://placehold.co/300x450/png?text=No+Poster";
        String defaultBanner = "https://placehold.co/800x450/png?text=No+Banner";

        film.setPosterUrl(handleUpload(filePoster, "posters", film.getPosterUrl(), defaultPoster));
        film.setBannerUrl(handleUpload(fileBanner, "banners", film.getBannerUrl(), defaultBanner));

        filmRepository.save(film);

        return "redirect:/";
    }

    @PostMapping("/films/edit")
    @ResponseBody
    public ResponseEntity<?> editFilm(@ModelAttribute Film film,
                                      @RequestParam(value = "category_id", required = false) String categoryId,
                                      @RequestParam(value = "filePoster", required = false) MultipartFile filePoster,
                                      @RequestParam(value = "fileBanner", required = false) MultipartFile fileBanner) {

        // 1. Kiểm tra ID phim
        if (film.getId() == null || film.getId().isBlank()) {
            return ResponseEntity.badRequest().body("ID phim không được để trống!");
        }

        // 2. Tìm phim cũ trong Database
        Film existingFilm = filmRepository.findById(film.getId()).orElse(null);

        if (existingFilm == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phim cần sửa!");
        }

        // 3. Cập nhật thông tin cơ bản từ Form vào existingFilm (tránh làm mất các cột khác)
        existingFilm.setTitle(film.getTitle());
        existingFilm.setDuration(film.getDuration());
        existingFilm.setRating(film.getRating());
        existingFilm.setReleaseDate(film.getReleaseDate());
        existingFilm.setSynopsis(film.getSynopsis());
        existingFilm.setDirector(film.getDirector());
        existingFilm.setCast(film.getCast());
        existingFilm.setIsNowShowing(film.getIsNowShowing());

        // 4. Xử lý Danh mục (Category) & Thể loại (Genre)
        if (categoryId != null && !categoryId.isBlank()) {
            categoryRepository.findById(categoryId).ifPresent(category -> {
                existingFilm.setCategory(category);

                // Nếu genre truyền từ form bị rỗng -> Lấy tên Danh mục mới
                if (film.getGenre() == null || film.getGenre().isBlank()) {
                    existingFilm.setGenre(category.getName());
                } else {
                    existingFilm.setGenre(film.getGenre());
                }
            });
        } else {
            if (film.getGenre() != null && !film.getGenre().isBlank()) {
                existingFilm.setGenre(film.getGenre());
            }
        }

        // Đảm bảo tuyệt đối Genre không bị NULL
        if (existingFilm.getGenre() == null || existingFilm.getGenre().isBlank()) {
            if (existingFilm.getCategory() != null) {
                existingFilm.setGenre(existingFilm.getCategory().getName());
            } else {
                existingFilm.setGenre("Chưa phân loại");
            }
        }

        // 5. Cập nhật Phân loại độ tuổi (AgeRating)
        if (film.getAgeRating() != null && !film.getAgeRating().isBlank()) {
            existingFilm.setAgeRating(film.getAgeRating());
        } else if (existingFilm.getAgeRating() == null || existingFilm.getAgeRating().isBlank()) {
            existingFilm.setAgeRating("P");
        }

        // 6. Xử lý Poster & Banner (Ưu tiên File mới -> Link mới -> Giữ Link cũ)
        existingFilm.setPosterUrl(handleUpload(filePoster, "posters", film.getPosterUrl(), existingFilm.getPosterUrl()));
        existingFilm.setBannerUrl(handleUpload(fileBanner, "banners", film.getBannerUrl(), existingFilm.getBannerUrl()));

        try {
            // 7. Lưu và TRẢ VỀ ĐỐI TƯỢNG PHIM MỚI dưới dạng JSON
            Film savedFilm = filmRepository.save(existingFilm);
            String categoryName = savedFilm.getCategory() != null ? savedFilm.getCategory().getName() : "";
            ResponseMovie response = new ResponseMovie(
                    savedFilm.getId(),
                    savedFilm.getTitle(),
                    savedFilm.getDuration(),
                    savedFilm.getPosterUrl(),
                    categoryName
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi lưu database: " + e.getMessage());
        }
    }

    // --- Hàm xử lý Upload
    private String handleUpload(MultipartFile file, String folder, String inputUrl, String fallbackUrl) {
        if (file != null && !file.isEmpty()) {
            try {
                return storageService.uploadFile(file, folder);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if (inputUrl != null && !inputUrl.isBlank()) {
            return inputUrl;
        }
        return fallbackUrl;
    }
}