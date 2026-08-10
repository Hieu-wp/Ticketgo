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

    // =========================================================================
    // 1. KIỂM TRA VÉ HỢP LỆ (Dùng cho ô Nhập mã vé / Quét QR)
    // =========================================================================
    @Transactional(readOnly = true)
    public TicketCheckResponse checkTicket(String ticketCode) {
        if (ticketCode == null || ticketCode.trim().isEmpty()) {
            throw new InvalidInputException("Mã vé không được để trống!");
        }

        Ticket ticket = ticketRepository.findById(ticketCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Mã vé [" + ticketCode + "] không tồn tại trên hệ thống!"));

        LocalDateTime now = LocalDateTime.now();

        // Check trạng thái vé bị hủy
        if ("CANCELLED".equalsIgnoreCase(ticket.getStatus())) {
            throw new InvalidInputException("Vé [" + ticketCode + "] đã bị hủy trước đó!");
        }

        // Check trạng thái vé online quá hạn giữ chỗ
        if ("HOLDING".equalsIgnoreCase(ticket.getStatus())) {
            if (ticket.getHoldExpiresAt() != null && ticket.getHoldExpiresAt().isBefore(now)) {
                throw new InvalidInputException("Vé [" + ticketCode + "] đã quá hạn giữ chỗ và chưa thanh toán!");
            }
            throw new InvalidInputException("Vé [" + ticketCode + "] đang trong trạng thái chờ thanh toán online!");
        }

        // Truy vấn thông tin suất chiếu
        Showtime showtime = showtimeRepository.findByIdWithDetails(ticket.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin suất chiếu của vé này!"));

        // Truy vấn thông tin khách hàng (nếu có)
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
                .showtimeId(showtime.getId())
                .status(ticket.getStatus())
                .isValid(true)
                .message("Vé hợp lệ! Có thể cho khách vào phòng chiếu.")
                .customerName(customerName)
                .customerPhone(customerPhone)
                .movieTitle(showtime.getMovie().getTitle())
                .roomName(showtime.getRoom().getTenPhong())
                .seatNumber(ticket.getSeatNumber())
                .showDate(showtime.getShowDate())
                .startTime(showtime.getStartTime())
                .price(ticket.getPrice())
                .createdAt(ticket.getCreatedAt())
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
        // Validate dữ liệu đầu vào
        if (request.getSelectedSeats() == null || request.getSelectedSeats().isEmpty()) {
            throw new InvalidInputException("Vui lòng chọn ít nhất 1 ghế để tạo vé!");
        }

        Showtime showtime = showtimeRepository.findByIdWithDetails(request.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Suất chiếu không tồn tại!"));

        LocalDateTime now = LocalDateTime.now();

        // 1. Kiểm tra tranh chấp ghế
        List<String> occupiedSeats = ticketRepository.findOccupiedSeatNumbers(
                request.getShowtimeId(),
                request.getSelectedSeats(),
                now
        );

        if (!occupiedSeats.isEmpty()) {
            throw new DuplicateResourceException("Các ghế sau đã có người đặt: " + String.join(", ", occupiedSeats));
        }

        // 2. Lưu hoặc cập nhật thông tin Khách hàng — KHÔNG ghi đè tên, chỉ tạo mới nếu SĐT chưa tồn tại
        Customer customer;
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().trim().isEmpty()) {
            String phone = request.getCustomerPhone().trim();
            try {
                customer = customerRepository.findByPhone(phone)
                        .orElseGet(() -> customerRepository.save(Customer.builder()
                                .name(request.getCustomerName().trim())
                                .phone(phone)
                                .build()));

            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                customer = customerRepository.findByPhone(phone)
                        .orElseThrow(() -> new ResourceNotFoundException("Không thể xử lý thông tin khách hàng, vui lòng thử lại!"));
            }
        } else {
            customer = customerRepository.save(Customer.builder()
                    .name(request.getCustomerName().trim())
                    .build());
        }

        // 3. Xử lý Combo (nếu có)
        Combo combo = null;
        if (request.getComboId() != null && !request.getComboId().trim().isEmpty()) {
            combo = comboRepository.findById(request.getComboId()).orElse(null);
        }

        // 4. Khởi tạo Booking (đơn hàng)
        Booking booking = Booking.builder()
                .customer(customer)
                .showtime(showtime)
                .combo(combo)
                .guestName(request.getCustomerName().trim())
                .selectedDrinks(request.getSelectedDrink())
                .selectedPopcorns(request.getSelectedPopcorn())
                .paymentMethod("COUNTER")
                .status("PAID")
                .totalAmount(BigDecimal.ZERO)
                .build();
        // 5. Tính giá vé & tạo từng Ticket, gắn vào Booking qua addTicket() (Hibernate tự set booking_id)
        double seatTotal = 0.0;

        for (String seatCode : request.getSelectedSeats()) {
            boolean isVip = isVipSeat(showtime.getRoom().getSeatLayout(), seatCode);
            double seatPrice = isVip ? showtime.getVipPrice() : showtime.getRegularPrice();
            seatTotal += seatPrice;

            Ticket ticket = Ticket.builder()
                    .showtimeId(showtime.getId())
                    .seatNumber(seatCode)
                    .seatType(isVip ? "VIP" : "NORMAL")
                    .price(seatPrice)
                    .customerId(customer.getId())
                    .status("SOLD")
                    .source("COUNTER")
                    .holdExpiresAt(null)
                    .build();
            // KHÔNG set .id() thủ công nữa -> để Ticket.@PrePersist tự sinh id + ticketCode đúng chuẩn

            booking.addTicket(ticket); // gắn 2 chiều: ticket.booking = booking
        }

        double comboTotal = combo != null && combo.getTotalPrice() != null ? combo.getTotalPrice() : 0.0;
        booking.setTotalAmount(BigDecimal.valueOf(seatTotal + comboTotal));

        // 6. Chỉ cần save Booking — cascade ALL tự lưu toàn bộ Ticket bên trong nó
        Booking savedBooking = bookingRepository.save(booking);

        // 7. Build ticketDetails SAU khi save (lúc này id/ticketCode của từng Ticket đã được sinh)
        List<BookingResponse.TicketDetail> ticketDetails = savedBooking.getTickets().stream()
                .map(t -> BookingResponse.TicketDetail.builder()
                        .ticketId(t.getId())
                        .ticketCode(t.getTicketCode())
                        .seatCode(t.getSeatNumber())
                        .price(BigDecimal.valueOf(t.getPrice()))
                        .build())
                .collect(java.util.stream.Collectors.toList());

        // 8. Trả về BookingResponse chuẩn hóa, dùng đúng id/mã do Booking entity tự sinh
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

    @Transactional(readOnly = true)
    public TicketCheckAndMapResponse checkTicketAndLocate(String ticketCode) {
        TicketCheckResponse ticketInfo = checkTicket(ticketCode); // tái dùng toàn bộ logic check hiện có
        ShowtimeSeatMapResponse seatMap = getSeatMapByShowtime(ticketInfo.getShowtimeId()); // tái dùng luôn
        return TicketCheckAndMapResponse.builder()
                .ticket(ticketInfo)
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