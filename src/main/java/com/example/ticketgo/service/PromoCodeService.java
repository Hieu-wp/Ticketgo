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
import java.util.HashMap;
import java.util.Map;

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
        validatePromoCodeInput(dto, true);

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

    // 5. KIỂM TRA MÃ GIẢM GIÁ KHI BÁN VÉ TẠI QUẦY (Không tăng used_count ở bước kiểm tra)
    @Transactional(readOnly = true)
    public Map<String, Object> checkPromoCode(String code, BigDecimal orderTotal) {
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập mã giảm giá!");
        }
        if (orderTotal == null) {
            throw new RuntimeException("Thiếu thông tin tổng đơn hàng!");
        }

        PromoCode promo = promoCodeRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại!"));

        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            throw new RuntimeException("Mã giảm giá đã bị vô hiệu hóa!");
        }

        LocalDate today = LocalDate.now();
        if (promo.getStartDate() == null || promo.getEndDate() == null ||
                today.isBefore(promo.getStartDate()) || today.isAfter(promo.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn hoặc chưa đến ngày áp dụng!");
        }

        int usedCount = promo.getUsedCount() != null ? promo.getUsedCount() : 0;
        int usageLimit = promo.getUsageLimit() != null ? promo.getUsageLimit() : 0;
        if (usedCount >= usageLimit) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng!");
        }

        BigDecimal minOrder = promo.getMinOrder() != null ? promo.getMinOrder() : BigDecimal.ZERO;
        if (orderTotal.compareTo(minOrder) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu " + minOrder + "đ để áp dụng mã này!");
        }

        BigDecimal discount;
        if ("percent".equalsIgnoreCase(promo.getDiscountType())) {
            discount = orderTotal.multiply(promo.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (promo.getMaxDiscount() != null && discount.compareTo(promo.getMaxDiscount()) > 0) {
                discount = promo.getMaxDiscount();
            }
        } else {
            discount = promo.getDiscountValue();
        }

        if (discount.compareTo(orderTotal) > 0) {
            discount = orderTotal;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("promoId", promo.getId());
        result.put("code", promo.getCode());
        result.put("name", promo.getName());
        result.put("discountAmount", discount);
        return result;
    }

    @Transactional
    public BigDecimal consumePromoCode(String code, BigDecimal orderTotal) {

        if (code == null || code.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        if (orderTotal == null || orderTotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Tổng đơn hàng không hợp lệ!");
        }

        String cleanCode = code.trim().toUpperCase();

        PromoCode promo = promoCodeRepository.findByCodeForUpdate(cleanCode)
                .orElseThrow(() ->
                        new RuntimeException("Mã giảm giá không tồn tại!"));

        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            throw new RuntimeException(
                    "Mã giảm giá đã bị vô hiệu hóa!"
            );
        }

        LocalDate today = LocalDate.now();

        if (promo.getStartDate() == null ||
                promo.getEndDate() == null ||
                today.isBefore(promo.getStartDate()) ||
                today.isAfter(promo.getEndDate())) {

            throw new RuntimeException(
                    "Mã giảm giá đã hết hạn hoặc chưa đến ngày áp dụng!"
            );
        }

        int usedCount = promo.getUsedCount() != null
                ? promo.getUsedCount()
                : 0;

        int usageLimit = promo.getUsageLimit() != null
                ? promo.getUsageLimit()
                : 0;

        if (usedCount >= usageLimit) {
            throw new RuntimeException(
                    "Mã giảm giá đã hết lượt sử dụng!"
            );
        }

        BigDecimal minOrder = promo.getMinOrder() != null
                ? promo.getMinOrder()
                : BigDecimal.ZERO;

        if (orderTotal.compareTo(minOrder) < 0) {
            throw new RuntimeException(
                    "Đơn hàng chưa đạt giá trị tối thiểu "
                            + minOrder
                            + "đ để áp dụng mã này!"
            );
        }

        BigDecimal discount;

        if ("percent".equalsIgnoreCase(promo.getDiscountType())) {

            discount = orderTotal
                    .multiply(promo.getDiscountValue())
                    .divide(
                            BigDecimal.valueOf(100)
                    );

            if (promo.getMaxDiscount() != null &&
                    discount.compareTo(promo.getMaxDiscount()) > 0) {

                discount = promo.getMaxDiscount();
            }

        } else {

            discount = promo.getDiscountValue();
        }

        if (discount == null ||
                discount.compareTo(BigDecimal.ZERO) < 0) {

            discount = BigDecimal.ZERO;
        }

        if (discount.compareTo(orderTotal) > 0) {
            discount = orderTotal;
        }

        promo.setUsedCount(usedCount + 1);

        promoCodeRepository.save(promo);

        return discount;
    }

    // 6. XÓA VOUCHER
    @Transactional
    public void delete(String id) {
        if (!promoCodeRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy mã giảm giá để xóa");
        }
        promoCodeRepository.deleteById(id);
    }

    // === BẮT TẤT CẢ NGOẠI LỆ / VALIDATE DỮ LIỆU ĐẦU VÀO ===
    private void validatePromoCodeInput(PromoCodeDTO dto, boolean isUpdate) {
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
        if (dto.getEndDate().isBefore(today)) {
            throw new RuntimeException("Ngày kết thúc phải lớn hơn hoặc bằng ngày hôm nay");
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