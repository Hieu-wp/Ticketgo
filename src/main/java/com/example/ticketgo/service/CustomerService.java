package com.example.ticketgo.service;

import com.example.ticketgo.dto.request.CustomerRequest;
import com.example.ticketgo.dto.response.BookingResponse;
import com.example.ticketgo.dto.response.CustomerResponse;
import com.example.ticketgo.dto.response.PageResponseDTO;
import com.example.ticketgo.dto.response.TransactionHistory;
import com.example.ticketgo.entity.Booking;
import com.example.ticketgo.entity.Customer;
import com.example.ticketgo.entity.Ticket;
import com.example.ticketgo.repository.BookingRepository;
import com.example.ticketgo.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public PageResponseDTO<CustomerResponse> getCustomers(String keyword, int pageNo, int pageSize, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);

        // Chuẩn hóa từ khóa tìm kiếm trong Java để tránh lỗi kiểu dữ liệu ở PostgreSQL
        String searchKeyword = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;

        Page<Customer> customerPage = customerRepository.searchCustomers(searchKeyword, pageable);

        List<CustomerResponse> content = customerPage.getContent().stream()
                .map(this::mapToCustomerResponseDTO)
                .collect(Collectors.toList());

        return PageResponseDTO.<CustomerResponse>builder()
                .content(content)
                .pageNo(customerPage.getNumber())
                .pageSize(customerPage.getSize())
                .totalElements(customerPage.getTotalElements())
                .totalPages(customerPage.getTotalPages())
                .isLast(customerPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(String id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với ID: " + id));
        return mapToCustomerResponseDTO(customer);
    }

    @Transactional(readOnly = true)
    public List<TransactionHistory> getCustomerTransactionHistory(String customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new RuntimeException("Không tìm thấy khách hàng với ID: " + customerId);
        }

        List<Booking> bookings = bookingRepository.findTransactionHistoryByCustomerId(customerId);

        return bookings.stream()
                .map(this::mapToTransactionHistory)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getCustomerBookings(String customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new RuntimeException("Không tìm thấy khách hàng với ID: " + customerId);
        }

        List<Booking> bookings = bookingRepository.findTransactionHistoryByCustomerId(customerId);

        return bookings.stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã tồn tại trong hệ thống");
        }

        Customer customer = Customer.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        return mapToCustomerResponseDTO(savedCustomer);
    }

    @Transactional
    public CustomerResponse updateCustomer(String id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với ID: " + id));

        if (!customer.getPhone().equals(request.getPhone()) && customerRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại mới đã được sử dụng bởi khách hàng khác");
        }

        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());

        Customer updatedCustomer = customerRepository.save(customer);
        return mapToCustomerResponseDTO(updatedCustomer);
    }

    // ==========================================
    // HELPER MAPPER METHODS
    // ==========================================

    private CustomerResponse mapToCustomerResponseDTO(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .createdAt(customer.getCreatedAt())
                .build();
    }

    private TransactionHistory mapToTransactionHistory(Booking booking) {
        String seats = (booking.getTickets() != null && !booking.getTickets().isEmpty())
                ? booking.getTickets().stream()
                .map(Ticket::getSeatNumber) // Đã sửa từ getSeatName() -> getSeatNumber()
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "))
                : "Chưa chọn ghế";

        return TransactionHistory.builder()
                .bookingCode(booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId())
                .transactionDate(booking.getCreatedAt())
                .movieName(booking.getShowtime() != null && booking.getShowtime().getMovie() != null
                        ? booking.getShowtime().getMovie().getTitle() : "N/A")
                .roomName(booking.getShowtime() != null && booking.getShowtime().getRoom() != null
                        ? booking.getShowtime().getRoom().getTenPhong() : "N/A") // Đã sửa từ getName() -> getTenPhong()
                .seats(seats)
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .build();
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        List<String> seatList = (booking.getTickets() != null)
                ? booking.getTickets().stream()
                .map(Ticket::getSeatNumber) // Đã sửa từ getSeatName() -> getSeatNumber()
                .filter(Objects::nonNull)
                .collect(Collectors.toList())
                : Collections.emptyList();

        List<BookingResponse.TicketDetail> ticketDetails = (booking.getTickets() != null)
                ? booking.getTickets().stream()
                .map(ticket -> BookingResponse.TicketDetail.builder()
                        .ticketId(ticket.getId())
                        .ticketCode(ticket.getTicketCode())
                        .seatCode(ticket.getSeatNumber()) // Đã sửa từ getSeatName() -> getSeatNumber()
                        .price(ticket.getPrice() != null ? BigDecimal.valueOf(ticket.getPrice()) : null) // Chuyển từ Double sang BigDecimal
                        .build())
                .collect(Collectors.toList())
                : Collections.emptyList();

        String showtimeInfo = (booking.getShowtime() != null)
                ? String.format("%s - %s",
                booking.getBookingDate() != null ? booking.getBookingDate().toString() : "",
                booking.getShowtime().getStartTime() != null ? booking.getShowtime().getStartTime().toString() : "").trim()
                : "N/A";

        return BookingResponse.builder()
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode() != null ? booking.getBookingCode() : booking.getId())
                .bookingDate(booking.getBookingDate())
                .movieName(booking.getShowtime() != null && booking.getShowtime().getMovie() != null
                        ? booking.getShowtime().getMovie().getTitle() : "N/A")
                .roomName(booking.getShowtime() != null && booking.getShowtime().getRoom() != null
                        ? booking.getShowtime().getRoom().getTenPhong() : "N/A") // Đã sửa từ getName() -> getTenPhong()
                .showtimeInfo(showtimeInfo)
                .customerName(booking.getCustomer() != null ? booking.getCustomer().getName() : booking.getGuestName())
                .customerPhone(booking.getCustomer() != null ? booking.getCustomer().getPhone() : null)
                .seats(seatList)
                .comboName(booking.getCombo() != null ? booking.getCombo().getName() : null)
                .totalAmount(booking.getTotalAmount())
                .tickets(ticketDetails)
                .build();
    }
}