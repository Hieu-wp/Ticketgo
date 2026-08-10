package com.example.ticketgo.service;

import com.example.ticketgo.dto.SeatLayout;
import com.example.ticketgo.dto.request.CreateBookingRequest;
import com.example.ticketgo.dto.response.BookingResponse;
import com.example.ticketgo.dto.response.VerifyBookingResponse;
import com.example.ticketgo.entity.Booking;
import com.example.ticketgo.entity.Combo;
import com.example.ticketgo.entity.Customer;
import com.example.ticketgo.entity.Showtime;
import com.example.ticketgo.entity.Ticket;
import com.example.ticketgo.repository.BookingRepository;
import com.example.ticketgo.repository.ComboRepository;
import com.example.ticketgo.repository.CustomerRepository;
import com.example.ticketgo.repository.ShowtimeRepository;
import com.example.ticketgo.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ComboRepository comboRepository;

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại"));

        // Chống trùng ghế theo seatNumber
        List<String> occupiedSeats = ticketRepository.findOccupiedSeatCodes(
                request.getShowtimeId(),
                request.getSeats(),
                LocalDateTime.now()
        );
        if (!occupiedSeats.isEmpty()) {
            throw new RuntimeException("Ghế đã bán hoặc đang giữ chỗ: " + String.join(", ", occupiedSeats));
        }

        // Xử lý Khách hàng — tra theo SĐT trước, tránh tạo trùng khách khi trùng tên
        CreateBookingRequest.CustomerInfo custInfo = request.getCustomer();
        Customer customer;
        String phone = custInfo.getPhone() != null ? custInfo.getPhone().trim() : null;

        if (phone != null && !phone.isEmpty()) {
            try {
                customer = customerRepository.findByPhone(phone)
                        .orElseGet(() -> customerRepository.save(Customer.builder()
                                .name(custInfo.getName().trim())
                                .phone(phone)
                                .build()));
                // Không còn ghi đè customer.name nữa -> giữ nguyên tên gốc lúc đăng ký lần đầu
            } catch (DataIntegrityViolationException e) {
                customer = customerRepository.findByPhone(phone)
                        .orElseThrow(() -> new RuntimeException("Không thể xử lý thông tin khách hàng, vui lòng thử lại!"));
            }
        } else {
            customer = customerRepository.save(Customer.builder()
                    .name(custInfo.getName().trim())
                    .build());
        }

        // Xử lý Combo
        Combo combo = null;
        String selectedDrinksStr = null;
        String selectedPopcornsStr = null;
        BigDecimal comboPrice = BigDecimal.ZERO;

        if (request.getCombo() != null && request.getCombo().getComboId() != null) {
            combo = comboRepository.findById(request.getCombo().getComboId()).orElse(null);
            if (combo != null && combo.getTotalPrice() != null) {
                comboPrice = BigDecimal.valueOf(combo.getTotalPrice());
            }
            if (request.getCombo().getDrinks() != null && !request.getCombo().getDrinks().isEmpty()) {
                selectedDrinksStr = String.join(", ", request.getCombo().getDrinks());
            }
            if (request.getCombo().getPopcorns() != null && !request.getCombo().getPopcorns().isEmpty()) {
                selectedPopcornsStr = String.join(", ", request.getCombo().getPopcorns());
            }
        }

        // Khởi tạo Booking
        Booking booking = Booking.builder()
                .customer(customer)
                .showtime(showtime)
                .combo(combo)
                .guestName(custInfo.getName().trim())
                .selectedDrinks(selectedDrinksStr)
                .selectedPopcorns(selectedPopcornsStr)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "COUNTER")
                .status("PAID")
                .totalAmount(BigDecimal.ZERO)
                .build();



        BigDecimal totalTicketAmount = BigDecimal.ZERO;
        Double regPrice = showtime.getRegularPrice() != null ? showtime.getRegularPrice() : 80000.0;
        Double vipPrice = showtime.getVipPrice() != null ? showtime.getVipPrice() : (regPrice + 10000.0);

        List<SeatLayout> roomLayout = showtime.getRoom() != null ? showtime.getRoom().getSeatLayout() : null;

        for (String seatNum : request.getSeats()) {
            boolean isVip = isVipSeat(roomLayout, seatNum);
            Double seatPrice = isVip ? vipPrice : regPrice;

            totalTicketAmount = totalTicketAmount.add(BigDecimal.valueOf(seatPrice));

            Ticket ticket = Ticket.builder()
                    .showtimeId(showtime.getId())
                    .seatNumber(seatNum)
                    .seatType(isVip ? "VIP" : "NORMAL")
                    .price(seatPrice)
                    .customerId(customer.getId())
                    .status("SOLD")
                    .build();

            booking.addTicket(ticket);
        }

        booking.setTotalAmount(totalTicketAmount.add(comboPrice));
        Booking savedBooking = bookingRepository.save(booking);

        String roomName = showtime.getRoom() != null ? showtime.getRoom().getTenPhong() : "";
        String movieTitle = showtime.getMovie() != null ? showtime.getMovie().getTitle() : "";

        return BookingResponse.builder()
                .bookingId(savedBooking.getId())
                .bookingCode(savedBooking.getBookingCode())
                .bookingDate(savedBooking.getBookingDate())
                .movieName(movieTitle)
                .roomName(roomName)
                .showtimeInfo(showtime.getStartTime() + " — " + roomName)
                .customerName(savedBooking.getGuestName())
                .customerPhone(customer.getPhone())
                .seats(request.getSeats())
                .comboName(combo != null ? combo.getName() : "Không")
                .totalAmount(savedBooking.getTotalAmount())
                .tickets(savedBooking.getTickets().stream().map(t ->
                        BookingResponse.TicketDetail.builder()
                                .ticketId(t.getId())
                                .ticketCode(t.getTicketCode())
                                .seatCode(t.getSeatNumber())
                                .price(BigDecimal.valueOf(t.getPrice()))
                                .build()
                ).collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public VerifyBookingResponse verifyBooking(String query) {
        String cleanQuery = query.trim().toUpperCase();

        Booking booking = bookingRepository.findByIdOrCodeToday(cleanQuery, LocalDate.now())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng hoặc mã vé không hợp lệ trong ngày"));

        List<String> seatCodes = booking.getTickets().stream()
                .map(Ticket::getSeatNumber)
                .collect(Collectors.toList());

        String comboDetail = "Không";
        if (booking.getCombo() != null) {
            comboDetail = booking.getCombo().getName();
            if (booking.getSelectedDrinks() != null || booking.getSelectedPopcorns() != null) {
                comboDetail += " (Nước: " + (booking.getSelectedDrinks() != null ? booking.getSelectedDrinks() : "Không")
                        + " | Bắp: " + (booking.getSelectedPopcorns() != null ? booking.getSelectedPopcorns() : "Không") + ")";
            }
        }

        Showtime showtime = booking.getShowtime();
        String movieTitle = (showtime != null && showtime.getMovie() != null) ? showtime.getMovie().getTitle() : "";
        String showtimeDisplay = (showtime != null) ? showtime.getStartTime() + " — " + showtime.getShowDate() : "";

        return VerifyBookingResponse.builder()
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .customerName(booking.getCustomer().getName())
                .customerPhone(booking.getCustomer().getPhone())
                .movieName(movieTitle)
                .showtime(showtimeDisplay)
                .seats(seatCodes)
                .paymentStatus("PAID".equalsIgnoreCase(booking.getStatus()) ? "ĐÃ THANH TOÁN" : booking.getStatus())
                .comboDetail(comboDetail)
                .totalAmount(booking.getTotalAmount())
                .build();
    }

    // Helper: kiểm tra ghế có phải VIP hay không, dựa vào seatLayout thật của phòng chiếu
    private boolean isVipSeat(List<SeatLayout> layout, String seatCode) {
        if (layout == null || seatCode == null) return false;
        return layout.stream()
                .filter(s -> seatCode.equalsIgnoreCase(s.code()))
                .findFirst()
                .map(s -> "VIP".equalsIgnoreCase(s.type()))
                .orElse(false);
    }
}