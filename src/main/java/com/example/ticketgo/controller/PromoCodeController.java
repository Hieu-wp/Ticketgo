package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.PromoCodeDTO;
import com.example.ticketgo.dto.response.PromoCodeResponse;
import com.example.ticketgo.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/promo-codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    @GetMapping
    public String showPromocodePage() {
        return "promocode";
    }

    // LẤY DANH SÁCH + TÌM KIẾM + LỌC + PHÂN TRANG
    @GetMapping("/api")
    @ResponseBody
    public ResponseEntity<PromoCodeResponse<List<PromoCodeDTO>>> getAllPromoCodes(
            @ModelAttribute PromoCodeDTO filterDTO) {
        try {
            Page<PromoCodeDTO> pageResult = promoCodeService.getAll(filterDTO);
            return ResponseEntity.ok(
                    PromoCodeResponse.success(
                            pageResult.getContent(),
                            "Lấy danh sách mã giảm giá thành công",
                            pageResult.getNumber(),
                            pageResult.getTotalPages(),
                            pageResult.getTotalElements()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(PromoCodeResponse.error(e.getMessage()));
        }
    }

    // CHI TIẾT THEO ID
    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<PromoCodeResponse<PromoCodeDTO>> getPromoCodeById(@PathVariable String id) {
        try {
            PromoCodeDTO dto = promoCodeService.getById(id);
            return ResponseEntity.ok(PromoCodeResponse.success(dto, "Lấy thông tin mã thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(PromoCodeResponse.error(e.getMessage()));
        }
    }

    // KIỂM TRA MÃ GIẢM GIÁ KHI BÁN VÉ TẠI QUẦY
    @GetMapping("/api/check")
    @ResponseBody
    public ResponseEntity<PromoCodeResponse<Map<String, Object>>> checkPromoCode(
            @RequestParam String code,
            @RequestParam BigDecimal orderTotal) {
        try {
            Map<String, Object> result = promoCodeService.checkPromoCode(code, orderTotal);
            return ResponseEntity.ok(PromoCodeResponse.success(result, "Áp dụng mã giảm giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(PromoCodeResponse.error(e.getMessage()));
        }
    }

    // TẠO MỚI MÃ GIẢM GIÁ
    @PostMapping("/api")
    @ResponseBody
    public ResponseEntity<PromoCodeResponse<PromoCodeDTO>> createPromoCode(@Valid @RequestBody PromoCodeDTO dto) {
        try {
            PromoCodeDTO created = promoCodeService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(PromoCodeResponse.success(created, "Tạo mã giảm giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(PromoCodeResponse.error(e.getMessage()));
        }
    }

    // CHỈNH SỬA MÃ GIẢM GIÁ
    @PutMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<PromoCodeResponse<PromoCodeDTO>> updatePromoCode(
            @PathVariable String id,
            @Valid @RequestBody PromoCodeDTO dto) {
        try {
            PromoCodeDTO updated = promoCodeService.update(id, dto);
            return ResponseEntity.ok(PromoCodeResponse.success(updated, "Cập nhật mã giảm giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(PromoCodeResponse.error(e.getMessage()));
        }
    }

    // XÓA MÃ GIẢM GIÁ
    @DeleteMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<PromoCodeResponse<Void>> deletePromoCode(@PathVariable String id) {
        try {
            promoCodeService.delete(id);
            return ResponseEntity.ok(PromoCodeResponse.success(null, "Xóa mã giảm giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(PromoCodeResponse.error(e.getMessage()));
        }
    }
}