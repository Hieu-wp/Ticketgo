package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.CategoryRequest;
import com.example.ticketgo.dto.response.CategoryResponse;
import com.example.ticketgo.entity.AgeRating;
import com.example.ticketgo.entity.Film;
import com.example.ticketgo.repository.AgeRatingRepository;
import com.example.ticketgo.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;
    private final AgeRatingRepository ageRatingRepository;


    /**
     * Lấy danh sách danh mục (có tìm kiếm & phân trang)
     */
    @GetMapping
    public ResponseEntity<Page<CategoryResponse>> getCategories(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(categoryService.getCategories(keyword, pageable));
    }

    /**
     * Lấy chi tiết danh mục theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable String id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    /**
     * Thêm danh mục mới
     */
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Cập nhật thông tin danh mục
     */
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable String id,
            @Valid @RequestBody CategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable String id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Xóa danh mục thành công!"));
        } catch (IllegalStateException e) {

            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    /**
     * Lấy danh sách phim thuộc danh mục
     */
    @GetMapping("/{id}/movies")
    public ResponseEntity<List<Film>> getMoviesByCategory(@PathVariable String id) {
        return ResponseEntity.ok(categoryService.getMoviesByCategoryId(id));
    }


    /**
     * Lấy danh sách độ tuổi
     */
    @GetMapping("/age-ratings")
    public ResponseEntity<List<AgeRating>> getAllAgeRatings() {
        return ResponseEntity.ok(ageRatingRepository.findAll());
    }

    /**
     * Thêm độ tuổi mới
     */
    @PostMapping("/age-ratings")
    public ResponseEntity<?> createAgeRating(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String description = body.get("description");

        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã độ tuổi không được để trống!"));
        }

        AgeRating ageRating = categoryService.createAgeRating(code.trim(), description);
        return ResponseEntity.status(HttpStatus.CREATED).body(ageRating);
    }

    /**
     * Xóa độ tuổi theo ID
     *
     */
    @DeleteMapping("/age-ratings/{id}")
    public ResponseEntity<Map<String, String>> deleteAgeRating(@PathVariable String id) {
        categoryService.deleteAgeRating(id);
        return ResponseEntity.ok(Map.of("message", "Xóa độ tuổi thành công!"));
    }
}