package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.PromoCodeDTO;
import com.example.ticketgo.entity.PromoCode;
import com.example.ticketgo.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    // 1. LẤY DANH SÁCH (TÌM KIẾM, LỌC & PHÂN TRANG)
    @Transactional(readOnly = true)
    public Page<PromoCodeDTO> getAll(PromoCodeDTO filterDTO) {
        int page = (filterDTO.getPage() != null && filterDTO.getPage() >= 0) ? filterDTO.getPage() : 0;
        int size = (filterDTO.getSize() != null && filterDTO.getSize() > 0) ? filterDTO.getSize() : 9;

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<PromoCode> promoCodes = promoCodeRepository.findByFilter(
                filterDTO.getKeyword(),
                filterDTO.getStatus() != null ? filterDTO.getStatus() : "all",
                pageable
        );

        return promoCodes.map(this::toDTO);
    }

    // 2. XEM CHI TIẾT VOUCHER theo ID
    @Transactional(readOnly = true)
    public PromoCodeDTO getById(String id) {
        PromoCode promoCode = promoCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã giảm giá có ID: " + id));
        return toDTO(promoCode);
    }

    // 3. TẠO MỚI VOUCHER
    @Transactional
    public PromoCodeDTO create(PromoCodeDTO dto) {
        validatePromoCodeInput(dto, false);

        if (promoCodeRepository.existsByCode(dto.getCode().trim().toUpperCase())) {
            throw new RuntimeException("Mã giảm giá '" + dto.getCode() + "' đã tồn tại trong hệ thống");
        }

        PromoCode entity = toEntity(dto);
        entity.setCode(dto.getCode().trim().toUpperCase());
        entity.setUsedCount(0);

        PromoCode saved = promoCodeRepository.save(entity);
        return toDTO(saved);
    }

    // 4. CHỈNH SỬA VOUCHER
    @Transactional
    public PromoCodeDTO update(String id, PromoCodeDTO dto) {
        PromoCode existing = promoCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã giảm giá cần cập nhật"));

        dto.setId(id);
        validatePromoCodeInput(dto);

        if (promoCodeRepository.existsByCodeAndIdNot(dto.getCode().trim().toUpperCase(), id)) {
            throw new RuntimeException("Mã giảm giá '" + dto.getCode() + "' đã bị trùng với chương trình khác");
        }

        existing.setName(dto.getName().trim());
        existing.setCode(dto.getCode().trim().toUpperCase());
        existing.setDiscountType(dto.getDiscountType());
        existing.setDiscountValue(dto.getDiscountValue());
        existing.setMinOrder(dto.getMinOrder() != null ? dto.getMinOrder() : BigDecimal.ZERO);

        // Xử lý giảm giá cố định (fixed) vs phần trăm (percent)
        if ("fixed".equalsIgnoreCase(dto.getDiscountType())) {
            existing.setMaxDiscount(dto.getDiscountValue());
        } else {
            existing.setMaxDiscount(dto.getMaxDiscount());
        }

        existing.setStartDate(dto.getStartDate());
        existing.setEndDate(dto.getEndDate());
        existing.setUsageLimit(dto.getUsageLimit());
        existing.setCustomerType(dto.getCustomerType());

        // Cập nhật trạng thái kích hoạt
        if (dto.getIsActive() != null) {
            existing.setIsActive(dto.getIsActive());
        } else if (dto.getStatus() != null) {
            existing.setIsActive(!"expired".equalsIgnoreCase(dto.getStatus()));
        }

        PromoCode updated = promoCodeRepository.save(existing);
        return toDTO(updated);
    }

    // Bắt buộc xóa hàm validate cũ ở dòng 140 và giữ lại duy nhất 1 hàm đã sửa so sánh BigDecimal dưới đây
    private void validatePromoCodeInput(PromoCodeDTO dto) {
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã giảm giá không được để trống");
        }

        // So sánh BigDecimal với 0 bằng compareTo
        if (dto.getDiscountValue() == null || dto.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Giá trị giảm giá phải lớn hơn 0");
        }

        // So sánh BigDecimal với 100 bằng compareTo
        if ("percent".equalsIgnoreCase(dto.getDiscountType())
                && dto.getDiscountValue().compareTo(new BigDecimal("100")) > 0) {
            throw new RuntimeException("Mức giảm giá theo phần trăm không được vượt quá 100%");
        }

        if (dto.getStartDate() != null && dto.getEndDate() != null && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }
    }

    // 5. XÓA VOUCHER
    @Transactional
    public void delete(String id) {
        if (!promoCodeRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy mã giảm giá để xóa");
        }
        promoCodeRepository.deleteById(id);
    }

    // === BẮT TẤT CẢ NGOẠI LỆ / VALIDATE DỮ LIỆU ĐẦU VÀO ===
    private void validatePromoCodeInput(PromoCodeDTO dto, boolean isUpdate) {
        // Kiểm tra trống ô input
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên chương trình không được để trống");
        }
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new RuntimeException("Mã giảm giá không được để trống");
        }
        if (dto.getDiscountType() == null || dto.getDiscountType().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn loại giảm giá");
        }
        if (dto.getDiscountValue() == null) {
            throw new RuntimeException("Giá trị giảm không được để trống");
        }
        if (dto.getMinOrder() == null) {
            throw new RuntimeException("Đơn hàng tối thiểu không được để trống");
        }
        if (dto.getStartDate() == null) {
            throw new RuntimeException("Ngày bắt đầu không được để trống");
        }
        if (dto.getEndDate() == null) {
            throw new RuntimeException("Ngày kết thúc không được để trống");
        }
        if (dto.getUsageLimit() == null) {
            throw new RuntimeException("Số lượng mã không được để trống");
        }

        // Validate ngày tháng
        LocalDate today = LocalDate.now();
        if (!isUpdate && dto.getStartDate().isBefore(today)) {
            throw new RuntimeException("Ngày bắt đầu phải từ ngày hôm nay trở đi");
        }
        if (dto.getEndDate().isBefore(today) || dto.getEndDate().isEqual(today)) {
            throw new RuntimeException("Ngày kết thúc phải lớn hơn ngày hôm nay");
        }
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        // Validate số liệu
        if (dto.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Giá trị giảm phải lớn hơn 0");
        }
        if ("percent".equalsIgnoreCase(dto.getDiscountType()) && dto.getDiscountValue().compareTo(new BigDecimal("100")) > 0) {
            throw new RuntimeException("Giá trị phần trăm giảm không được vượt quá 100%");
        }
        if (dto.getMinOrder().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Giá trị đơn hàng tối thiểu không được âm");
        }
        if (dto.getUsageLimit() <= 0) {
            throw new RuntimeException("Số lượng mã phải lớn hơn 0");
        }
    }

    // MAPPING ENTITY -> DTO
    private PromoCodeDTO toDTO(PromoCode entity) {
        PromoCodeDTO dto = new PromoCodeDTO();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setDiscountType(entity.getDiscountType());
        dto.setDiscountValue(entity.getDiscountValue());
        dto.setMaxDiscount(entity.getMaxDiscount());
        dto.setMinOrder(entity.getMinOrder());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setUsageLimit(entity.getUsageLimit());
        dto.setUsedCount(entity.getUsedCount());
        dto.setCustomerType(entity.getCustomerType());
        dto.setIsActive(entity.getIsActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setStatus(entity.getStatus());
        return dto;
    }

    // MAPPING DTO -> ENTITY
    private PromoCode toEntity(PromoCodeDTO dto) {
        PromoCode entity = new PromoCode();
        entity.setId(dto.getId());
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setDiscountType(dto.getDiscountType());
        entity.setDiscountValue(dto.getDiscountValue());
        entity.setMaxDiscount(dto.getMaxDiscount());
        entity.setMinOrder(dto.getMinOrder());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setUsageLimit(dto.getUsageLimit());
        entity.setCustomerType(dto.getCustomerType() != null ? dto.getCustomerType() : "Tất cả khách hàng");
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        return entity;
    }
}