package com.example.ticketgo.service;

import com.example.ticketgo.dto.SeatLayout;
import com.example.ticketgo.dto.request.CounterBookingRequest;
import com.example.ticketgo.dto.response.*;
import com.example.ticketgo.entity.*;
import com.example.ticketgo.exception.DuplicateResourceException;
import com.example.ticketgo.exception.InvalidInputException;
import com.example.ticketgo.exception.ResourceNotFoundException;
import com.example.ticketgo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CounterBookingService {

    private final TicketRepository ticketRepository;
    private final ShowtimeRepository showtimeRepository;
    private final CustomerRepository customerRepository;
    private final BookingRepository  bookingRepository;
    private final ComboRepository comboRepository;
    private final ProductRepository productRepository;
    private final PromoCodeService promoCodeService;

    // =========================================================================
    // 1. KIỂM TRA VÉ HỢP LỆ (Dùng cho ô Nhập mã vé / Quét QR)
    // =========================================================================
    // Bỏ readOnly = true để cho phép ghi/sửa Database
    @Transactional
    public TicketCheckResponse checkTicket(String ticketCode) {
        if (ticketCode == null || ticketCode.trim().isEmpty()) {
            throw new InvalidInputException("Mã vé hoặc Mã đặt chỗ không được để trống!");
        }

        String cleanCode = ticketCode.trim().toUpperCase();

        List<Ticket> tickets = ticketRepository.findByAnyCode(cleanCode);
        if (tickets.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin vé hoặc đơn hàng với mã [" + cleanCode + "]!");
        }

        Ticket ticket = tickets.get(0);
        LocalDateTime now = LocalDateTime.now();

        if ("CANCELLED".equalsIgnoreCase(ticket.getStatus())) {
            throw new InvalidInputException("Vé [" + cleanCode + "] đã bị hủy trước đó!");
        }

        if ("HOLDING".equalsIgnoreCase(ticket.getStatus())) {
            if (ticket.getHoldExpiresAt() != null && ticket.getHoldExpiresAt().isBefore(now)) {
                throw new InvalidInputException("Vé [" + cleanCode + "] đã quá hạn giữ chỗ!");
            }
            throw new InvalidInputException("Vé [" + cleanCode + "] đang trong trạng thái chờ thanh toán!");
        }

        // =========================================================================
        // ĐỔI PAYMENT_METHOD THÀNH 'COUNTER' VÀ LƯU VÀO DATABASE
        // =========================================================================
        Booking booking = ticket.getBooking();
        if (booking != null) {
            booking.setPaymentMethod("COUNTER");
            bookingRepository.save(booking); // Cập nhật payment_method = 'COUNTER' trong bảng booking
        }

        for (Ticket t : tickets) {
            t.setSource("COUNTER");
        }
        ticketRepository.saveAll(tickets); // Cập nhật source = 'COUNTER' trong bảng ticket

        Showtime showtime = showtimeRepository.findByIdWithDetails(ticket.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin suất chiếu!"));

        String customerName = "Khách vãng lai";
        String customerPhone = "N/A";
        if (ticket.getCustomerId() != null) {
            Customer customer = customerRepository.findById(ticket.getCustomerId()).orElse(null);
            if (customer != null) {
                customerName = customer.getName();
                customerPhone = customer.getPhone() != null ? customer.getPhone() : "N/A";
            }
        }

        return TicketCheckResponse.builder()
                .ticketId(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .showtimeId(showtime.getId())
                .status(ticket.getStatus())
                .isValid(true)
                .message("Vé hợp lệ!")
                .customerName(customerName)
                .customerPhone(customerPhone)
                .movieTitle(showtime.getMovie().getTitle())
                .roomName(showtime.getRoom().getTenPhong())
                .seatNumber(ticket.getSeatNumber())
                .showDate(showtime.getShowDate())
                .startTime(showtime.getStartTime())
                .price(ticket.getPrice())
                .createdAt(ticket.getCreatedAt())
                .paymentMethod("COUNTER") // Trả về COUNTER
                .build();
    }


    // =========================================================================
    // 2. TỰ ĐỘNG LẤY SUẤT CHIẾU KHI CHỌN PHIM
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ShowtimeSummaryResponse> getShowtimesByMovie(String movieId) {
        if (movieId == null || movieId.trim().isEmpty()) {
            throw new InvalidInputException("Mã phim không được để trống!");
        }

        List<Showtime> showtimes = showtimeRepository.findByMovieId(movieId);

        return showtimes.stream().map(st -> ShowtimeSummaryResponse.builder()
                .id(st.getId())
                .movieId(st.getMovie().getId())
                .movieTitle(st.getMovie().getTitle())
                .roomId(st.getRoom().getId())
                .roomName(st.getRoom().getTenPhong())
                .showDate(st.getShowDate())
                .startTime(st.getStartTime())
                .endTime(st.getEndTime())
                .regularPrice(st.getRegularPrice())
                .vipPrice(st.getVipPrice())
                .build()
        ).toList();
    }


    // 3. LẤY SƠ ĐỒ PHÒNG & TRẠNG THÁI GHẾ CỦA SUẤT CHIẾU
    @Transactional(readOnly = true)
    public ShowtimeSeatMapResponse getSeatMapByShowtime(String showtimeId) {
        Showtime showtime = showtimeRepository.findByIdWithDetails(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu với ID: " + showtimeId));

        ScreeningRoom room = showtime.getRoom();
        LocalDateTime now = LocalDateTime.now();

        List<Ticket> activeTickets = ticketRepository.findActiveTicketsByShowtime(showtimeId, now);

        List<String> soldSeats = new ArrayList<>();
        List<String> holdingSeats = new ArrayList<>();
        List<ShowtimeSeatMapResponse.SeatOccupantDetail> seatDetails = new ArrayList<>();

        // customerId và Customer.id đều là String
        List<String> customerIds = activeTickets.stream()
                .map(Ticket::getCustomerId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        Map<String, Customer> customerMap = customerRepository.findAllById(customerIds).stream()
                .collect(java.util.stream.Collectors.toMap(Customer::getId, c -> c));

        for (Ticket ticket : activeTickets) {
            boolean isSold = "SOLD".equalsIgnoreCase(ticket.getStatus());
            boolean isHolding = "HOLDING".equalsIgnoreCase(ticket.getStatus());

            if (isSold) soldSeats.add(ticket.getSeatNumber());
            else if (isHolding) holdingSeats.add(ticket.getSeatNumber());

            if (isSold || isHolding) {
                Customer customer = ticket.getCustomerId() != null ? customerMap.get(ticket.getCustomerId()) : null;
                Booking booking = ticket.getBooking(); // lấy booking gắn với vé này

                seatDetails.add(ShowtimeSeatMapResponse.SeatOccupantDetail.builder()
                        .seatCode(ticket.getSeatNumber())
                        .customerName(booking != null ? booking.getGuestName() : (customer != null ? customer.getName() : "Khách vãng lai"))
                        .customerPhone(customer != null && customer.getPhone() != null ? customer.getPhone() : "N/A")
                        .ticketCode(ticket.getTicketCode())
                        .status(ticket.getStatus())
                        .seatType(ticket.getSeatType())
                        .ticketPrice(ticket.getPrice())
                        .bookingCode(booking != null ? booking.getBookingCode() : null)
                        .comboName(booking != null && booking.getCombo() != null ? booking.getCombo().getName() : null)
                        .comboPrice(booking != null && booking.getCombo() != null ? booking.getCombo().getTotalPrice() : null)
                        .totalAmount(booking != null && booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : null)
                        .paymentMethod(booking != null && booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "COUNTER") // THÊM DÒNG NÀY
                        .build());
            }
        }

        return ShowtimeSeatMapResponse.builder()
                .showtimeId(showtime.getId())
                .movieId(showtime.getMovie().getId())
                .movieTitle(showtime.getMovie().getTitle())
                .roomId(room.getId())
                .roomName(room.getTenPhong())
                .showDate(showtime.getShowDate())
                .startTime(showtime.getStartTime())
                .regularPrice(showtime.getRegularPrice())
                .vipPrice(showtime.getVipPrice())
                .coLoiDi(room.getCoLoiDi())
                .soHangGhe(room.getSoHangGhe())
                .soCotGhe(room.getSoCotGhe())
                .seatLayout(room.getSeatLayout())
                .soldSeats(soldSeats)
                .holdingSeats(holdingSeats)
                .seatDetails(seatDetails)
                .build();
    }

    // 4. TẠO VÉ BÁN TẠI QUẦY & LƯU THÔNG TIN KHÁCH HÀNG
    @Transactional
    public BookingResponse createCounterBooking(CounterBookingRequest request) {

        if (request.getSelectedSeats() == null || request.getSelectedSeats().isEmpty()) {
            throw new InvalidInputException("Vui lòng chọn ít nhất 1 ghế để tạo vé!");
        }

        if (request.getCustomerName() == null || request.getCustomerName().trim().isEmpty()) {
            throw new InvalidInputException("Tên khách hàng không được để trống!");
        }

        Showtime showtime = showtimeRepository
                .findByIdWithDetails(request.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Suất chiếu không tồn tại!"));

        LocalDateTime now = LocalDateTime.now();

        List<String> occupiedSeats = ticketRepository.findOccupiedSeatNumbers(
                request.getShowtimeId(),
                request.getSelectedSeats(),
                now
        );

        if (!occupiedSeats.isEmpty()) {
            throw new DuplicateResourceException("Các ghế sau đã có người đặt: " + String.join(", ", occupiedSeats));
        }

        Customer customer;
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().trim().isEmpty()) {
            String phone = request.getCustomerPhone().trim();
            try {
                customer = customerRepository.findByPhone(phone)
                        .orElseGet(() -> customerRepository.save(
                                Customer.builder()
                                        .name(request.getCustomerName().trim())
                                        .phone(phone)
                                        .build()
                        ));
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                customer = customerRepository.findByPhone(phone)
                        .orElseThrow(() -> new ResourceNotFoundException("Không thể xử lý thông tin khách hàng, vui lòng thử lại!"));
            }
        } else {
            customer = customerRepository.save(
                    Customer.builder()
                            .name(request.getCustomerName().trim())
                            .build()
            );
        }

        Combo combo = null;
        Product popcornProduct = null;
        Product drinkProduct = null;
        int popcornQuantity = 0;
        int drinkQuantity = 0;

        if (request.getComboId() != null && !request.getComboId().trim().isEmpty()) {

            combo = comboRepository.findByIdWithDetails(request.getComboId().trim())
                    .orElseGet(() -> comboRepository.findById(request.getComboId().trim())
                            .orElseThrow(() -> new ResourceNotFoundException("Combo không tồn tại!")));

            popcornProduct = combo.getPopcorn();

            if (popcornProduct == null) {
                throw new InvalidInputException("Combo này chưa được cấu hình sản phẩm bắp!");
            }

            popcornQuantity = (combo.getPopcornQuantity() != null && combo.getPopcornQuantity() > 0)
                    ? combo.getPopcornQuantity()
                    : 1;

            int popcornStock = popcornProduct.getQuantity() != null ? popcornProduct.getQuantity() : 0;
            if (popcornStock < popcornQuantity) {
                throw new InvalidInputException("Bắp \"" + popcornProduct.getName() + "\" không đủ số lượng. Còn " + popcornStock + ", cần " + popcornQuantity + ".");
            }

            if (combo.getDrinks() != null && !combo.getDrinks().isEmpty()) {

                if (request.getSelectedDrink() == null || request.getSelectedDrink().trim().isEmpty()) {
                    throw new InvalidInputException("Vui lòng chọn 1 loại nước cho combo!");
                }

                String drinkInput = request.getSelectedDrink().trim();

                drinkProduct = productRepository.findById(drinkInput)
                        .orElseGet(() -> productRepository.findByNameIgnoreCaseAndType(drinkInput, "DRINK")
                                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm nước \"" + drinkInput + "\"!")));

                final String targetDrinkId = drinkProduct.getId();
                boolean drinkBelongsToCombo = combo.getDrinks().stream()
                        .anyMatch(d -> d.getProduct() != null && d.getProduct().getId().equals(targetDrinkId))
                        || productRepository.existsDrinkInCombo(combo.getId(), targetDrinkId);

                if (!drinkBelongsToCombo) {
                    throw new InvalidInputException("Nước \"" + drinkProduct.getName() + "\" không thuộc combo \"" + combo.getName() + "\"!");
                }

                drinkQuantity = 1;
                int drinkStock = drinkProduct.getQuantity() != null ? drinkProduct.getQuantity() : 0;

                if (drinkStock < drinkQuantity) {
                    throw new InvalidInputException("Nước \"" + drinkProduct.getName() + "\" không đủ số lượng. Còn " + drinkStock + ".");
                }
            }
        }

        double seatTotal = 0.0;
        Double regularPrice = showtime.getRegularPrice() != null ? showtime.getRegularPrice() : 80000.0;
        Double vipPrice = showtime.getVipPrice() != null ? showtime.getVipPrice() : regularPrice + 10000.0;

        Booking booking = Booking.builder()
                .customer(customer)
                .showtime(showtime)
                .combo(combo)
                .guestName(request.getCustomerName().trim())
                .selectedDrinks(drinkProduct != null ? drinkProduct.getName() : request.getSelectedDrink())
                .selectedPopcorns(popcornProduct != null ? popcornProduct.getName() : request.getSelectedPopcorn())
                .paymentMethod("COUNTER")
                .status("PAID")
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (String seatCode : request.getSelectedSeats()) {
            if (seatCode == null || seatCode.trim().isEmpty()) {
                throw new InvalidInputException("Mã ghế không hợp lệ!");
            }

            String cleanSeatCode = seatCode.trim().toUpperCase();
            boolean isVip = isVipSeat(showtime.getRoom().getSeatLayout(), cleanSeatCode);
            double seatPrice = isVip ? vipPrice : regularPrice;
            seatTotal += seatPrice;

            Ticket ticket = Ticket.builder()
                    .showtimeId(showtime.getId())
                    .seatNumber(cleanSeatCode)
                    .seatType(isVip ? "VIP" : "NORMAL")
                    .price(seatPrice)
                    .customerId(customer.getId())
                    .status("SOLD")
                    .source("COUNTER")
                    .holdExpiresAt(null)
                    .build();

            booking.addTicket(ticket);
        }

        double comboTotal = (combo != null && combo.getTotalPrice() != null) ? combo.getTotalPrice() : 0.0;
        BigDecimal subtotal = BigDecimal.valueOf(seatTotal + comboTotal);

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getPromoCode() != null && !request.getPromoCode().trim().isEmpty()) {
            discountAmount = promoCodeService.consumePromoCode(request.getPromoCode(), subtotal);
        }

        BigDecimal finalAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        booking.setTotalAmount(finalAmount);

        Booking savedBooking = bookingRepository.save(booking);

        if (combo != null) {
            int currentPopcornStock = popcornProduct.getQuantity() != null ? popcornProduct.getQuantity() : 0;
            if (currentPopcornStock < popcornQuantity) {
                throw new InvalidInputException("Bắp \"" + popcornProduct.getName() + "\" vừa hết hàng. Vui lòng chọn combo khác!");
            }
            popcornProduct.setQuantity(currentPopcornStock - popcornQuantity);
            productRepository.save(popcornProduct);

            if (drinkProduct != null) {
                int currentDrinkStock = drinkProduct.getQuantity() != null ? drinkProduct.getQuantity() : 0;
                if (currentDrinkStock < drinkQuantity) {
                    throw new InvalidInputException("Nước \"" + drinkProduct.getName() + "\" vừa hết hàng. Vui lòng chọn loại nước khác!");
                }
                drinkProduct.setQuantity(currentDrinkStock - drinkQuantity);
                productRepository.save(drinkProduct);
            }
        }

        List<BookingResponse.TicketDetail> ticketDetails = savedBooking.getTickets()
                .stream()
                .map(t -> BookingResponse.TicketDetail.builder()
                        .ticketId(t.getId())
                        .ticketCode(t.getTicketCode())
                        .seatCode(t.getSeatNumber())
                        .price(BigDecimal.valueOf(t.getPrice()))
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return BookingResponse.builder()
                .bookingId(savedBooking.getId())
                .bookingCode(savedBooking.getBookingCode())
                .bookingDate(savedBooking.getBookingDate())
                .customerName(savedBooking.getGuestName())
                .customerPhone(customer.getPhone())
                .movieName(showtime.getMovie().getTitle())
                .roomName(showtime.getRoom().getTenPhong())
                .showtimeInfo(showtime.getStartTime() + " - " + showtime.getShowDate())
                .seats(request.getSelectedSeats())
                .comboName(combo != null ? combo.getName() : "Không")
                .totalAmount(savedBooking.getTotalAmount())
                .tickets(ticketDetails)
                .build();
    }

    @Transactional
    public TicketCheckAndMapResponse checkTicketAndLocate(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new InvalidInputException("Mã vé không được để trống!");
        }

        String cleanCode = code.trim().toUpperCase();
        List<Ticket> tickets = ticketRepository.findByAnyCode(cleanCode);
        if (tickets.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin vé [" + cleanCode + "]!");
        }

        Ticket ticket = tickets.get(0);
        Booking booking = ticket.getBooking();

        // 1. Lưu lại hình thức thanh toán BAN ĐẦU (để Frontend hiển thị thông báo Đặt qua App hay Mua tại quầy)
        String originalPaymentMethod = "COUNTER";
        if (booking != null && booking.getPaymentMethod() != null) {
            originalPaymentMethod = booking.getPaymentMethod();
        } else if (ticket.getSource() != null) {
            originalPaymentMethod = ticket.getSource();
        }

        // 2. CẬP NHẬT TRỰC TIẾP XUỐNG DATABASE SANG 'COUNTER'
        if (booking != null) {
            booking.setPaymentMethod("COUNTER");
            bookingRepository.save(booking); // Cập nhật bảng booking
        }

        for (Ticket t : tickets) {
            t.setSource("COUNTER");
        }
        ticketRepository.saveAll(tickets); // Cập nhật bảng ticket

        // 3. Chuẩn bị dữ liệu vé trả về
        Showtime showtime = showtimeRepository.findByIdWithDetails(ticket.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin suất chiếu!"));

        String customerName = "Khách vãng lai";
        String customerPhone = "N/A";
        if (ticket.getCustomerId() != null) {
            Customer customer = customerRepository.findById(ticket.getCustomerId()).orElse(null);
            if (customer != null) {
                customerName = customer.getName();
                customerPhone = customer.getPhone() != null ? customer.getPhone() : "N/A";
            }
        }

        TicketCheckResponse ticketResponse = TicketCheckResponse.builder()
                .ticketId(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .showtimeId(showtime.getId())
                .status(ticket.getStatus())
                .isValid(true)
                .message("Vé hợp lệ!")
                .customerName(customerName)
                .customerPhone(customerPhone)
                .movieTitle(showtime.getMovie().getTitle())
                .roomName(showtime.getRoom().getTenPhong())
                .seatNumber(ticket.getSeatNumber())
                .showDate(showtime.getShowDate())
                .startTime(showtime.getStartTime())
                .price(ticket.getPrice())
                .createdAt(ticket.getCreatedAt())
                .paymentMethod(originalPaymentMethod) // Giữ hình thức ban đầu để JS báo đúng "APP"
                .build();

        // 4. Lấy sơ đồ ghế mới nhất (Lúc này DB đã mang trạng thái COUNTER -> Ghế sẽ hiển thị màu Xanh lá)
        ShowtimeSeatMapResponse seatMap = getSeatMapByShowtime(showtime.getId());

        return TicketCheckAndMapResponse.builder()
                .ticket(ticketResponse)
                .seatMap(seatMap)
                .build();
    }

    // Helper kiểm tra ghế chọn thuộc loại VIP hay Thường từ Json layout
    private boolean isVipSeat(List<SeatLayout> layout, String seatCode) {
        if (layout == null) return false;
        return layout.stream()
                .filter(s -> seatCode.equalsIgnoreCase(s.code()))
                .findFirst()
                .map(s -> "VIP".equalsIgnoreCase(s.type()))
                .orElse(false);
    }
}