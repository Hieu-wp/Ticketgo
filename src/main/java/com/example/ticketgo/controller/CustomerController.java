package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.CustomerRequest;
import com.example.ticketgo.dto.response.BookingResponse;
import com.example.ticketgo.dto.response.CustomerResponse;
import com.example.ticketgo.dto.response.PageResponseDTO;
import com.example.ticketgo.dto.response.TransactionHistory;
import com.example.ticketgo.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;


    @GetMapping({"/customers"})
    public String renderCustomerPage() {

        return "Customer";
    }

    // 2. REST API ENDPOINTS (Phục vụ JavaScript Fetch / Axios)

    // Lấy danh sách khách hàng có phân trang & tìm kiếm
    @GetMapping("/api/customers")
    @ResponseBody
    public ResponseEntity<PageResponseDTO<CustomerResponse>> getCustomers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "DESC") String sortDir
    ) {
        PageResponseDTO<CustomerResponse> response = customerService.getCustomers(keyword, page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }

    // Lấy chi tiết thông tin 1 khách hàng theo ID
    @GetMapping("/api/customers/{id}")
    @ResponseBody
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable String id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    // Lấy lịch sử giao dịch cho Modal trên UI (Bảng đơn giản)
    @GetMapping("/api/customers/{id}/history")
    @ResponseBody
    public ResponseEntity<List<TransactionHistory>> getCustomerTransactionHistory(@PathVariable String id) {
        return ResponseEntity.ok(customerService.getCustomerTransactionHistory(id));
    }

    // Lấy lịch sử đặt vé dạng BookingResponse chi tiết
    @GetMapping("/api/customers/{id}/bookings")
    @ResponseBody
    public ResponseEntity<List<BookingResponse>> getCustomerBookings(@PathVariable String id) {
        return ResponseEntity.ok(customerService.getCustomerBookings(id));
    }

    // Thêm mới khách hàng
    @PostMapping("/api/customers")
    @ResponseBody
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse createdCustomer = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCustomer);
    }

    // Cập nhật thông tin khách hàng
    @PutMapping("/api/customers/{id}")
    @ResponseBody
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable String id,
            @Valid @RequestBody CustomerRequest request
    ) {
        CustomerResponse updatedCustomer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(updatedCustomer);
    }
}