package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.CategoryRequest;
import com.example.ticketgo.dto.response.CategoryResponse;
import com.example.ticketgo.entity.AgeRating;
import com.example.ticketgo.entity.Category;
import com.example.ticketgo.entity.Film;
import com.example.ticketgo.exception.DuplicateResourceException;
import com.example.ticketgo.exception.ResourceNotFoundException;
import com.example.ticketgo.repository.AgeRatingRepository;
import com.example.ticketgo.repository.CategoryRepository;
import com.example.ticketgo.repository.FilmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AgeRatingRepository ageRatingRepository;
    private final FilmRepository filmRepository;

    // 1. TÌM KIẾM VÀ PHÂN TRANG DANH MỤC
    @Transactional(readOnly = true)
    public Page<CategoryResponse> getCategories(String keyword, Pageable pageable) {
        return categoryRepository.searchCategories(keyword, pageable)
                .map(this::mapToResponse);
    }

    // 2. LẤY CHI TIẾT DANH MỤC
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục!"));
        return mapToResponse(category);
    }

    // 3. THÊM DANH MỤC MỚI
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName().trim())) {
            throw new DuplicateResourceException("Tên danh mục '" + request.getName() + "' đã tồn tại!");
        }

        Category category = Category.builder()
                .id(generateShortId())
                .name(request.getName().trim())
                .description(request.getDescription())
                .status(request.getStatus())
                .count(0)
                .build();

        if (request.getAgeRatingId() != null && !request.getAgeRatingId().isBlank()) {
            AgeRating ageRating = ageRatingRepository.findById(request.getAgeRatingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Độ tuổi chọn không tồn tại!"));
            category.setAgeRating(ageRating);
        }

        return mapToResponse(categoryRepository.save(category));
    }

    // 4. SỬA DANH MỤC
    @Transactional
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại!"));

        if (!category.getName().equalsIgnoreCase(request.getName().trim())
                && categoryRepository.existsByName(request.getName().trim())) {
            throw new DuplicateResourceException("Tên danh mục '" + request.getName() + "' đã tồn tại!");
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setStatus(request.getStatus());

        if (request.getAgeRatingId() != null && !request.getAgeRatingId().isBlank()) {
            AgeRating ageRating = ageRatingRepository.findById(request.getAgeRatingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Độ tuổi chọn không tồn tại!"));
            category.setAgeRating(ageRating);
        } else {
            category.setAgeRating(null);
        }

        return mapToResponse(categoryRepository.save(category));
    }

    // 5. XÓA DANH MỤC
    @Transactional
    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại!"));


        int actualMovieCount = filmRepository.findByCategoryId(id).size();

        if (actualMovieCount > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa! Danh mục này đang chứa " + actualMovieCount + " phim."
            );
        }

        categoryRepository.delete(category);
    }

    // 6. XEM DANH SÁCH PHIM THUỘC DANH MỤC
    @Transactional(readOnly = true)
    public List<Film> getMoviesByCategoryId(String categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Danh mục không tồn tại!");
        }
        return filmRepository.findByCategoryId(categoryId);
    }

    // 7. THÊM ĐỘ TUỔI MỚI
    @Transactional
    public AgeRating createAgeRating(String code, String description) {
        if (ageRatingRepository.existsByCode(code.trim())) {
            throw new DuplicateResourceException("Mã độ tuổi '" + code + "' đã tồn tại!");
        }

        AgeRating ageRating = AgeRating.builder()
                .id(generateShortId())
                .code(code.trim().toUpperCase())
                .description(description)
                .build();

        return ageRatingRepository.save(ageRating);
    }

    // 8. XÓA ĐỘ TUỔI
    @Transactional
    public void deleteAgeRating(String ageRatingId) {
        if (!ageRatingRepository.existsById(ageRatingId)) {
            throw new ResourceNotFoundException("Độ tuổi không tồn tại!");
        }
        ageRatingRepository.deleteById(ageRatingId);
    }


    private CategoryResponse mapToResponse(Category category) {
        // Lấy số lượng phim thực tế thuộc danh mục này trong Database
        int actualMovieCount = filmRepository.findByCategoryId(category.getId()).size();

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .count(actualMovieCount)
                .status(category.getStatus())
                .ageRatingId(category.getAgeRating() != null ? category.getAgeRating().getId() : null)
                .ageRatingCode(category.getAgeRating() != null ? category.getAgeRating().getCode() : null)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private String generateShortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 5);
    }
}