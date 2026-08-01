package com.example.ticketgo.controller;

import com.example.ticketgo.dto.request.RequestScreeningRoom;
import com.example.ticketgo.dto.response.ResponseScreeningRoom;
import com.example.ticketgo.service.ScreeningRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/screening-rooms")
@RequiredArgsConstructor
public class ScreeningRoom {

    private final ScreeningRoomService screeningRoomService;

    // Trả về giao diện HTML của trang quản lý phòng chiếu
    @GetMapping("/view")
    public String showScreeningRoomPage() {
        return "ScreeningRoom";
    }

    // Lấy thông tin chi tiết một phòng chiếu theo ID (Bao gồm mảng JSON sơ đồ ghế)
    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<ResponseScreeningRoom> getScreeningRoomById(@PathVariable String id) {
        ResponseScreeningRoom response = screeningRoomService.getScreeningRoomById(id);
        return ResponseEntity.ok(response);
    }

    // Thêm mới phòng chiếu kèm sơ đồ ghế dạng JSON
    @PostMapping("/api")
    @ResponseBody
    public ResponseEntity<ResponseScreeningRoom> createScreeningRoom(@Valid @RequestBody RequestScreeningRoom request) {
        ResponseScreeningRoom response = screeningRoomService.createScreeningRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Lấy danh sách toàn bộ phòng chiếu trong hệ thống
    @GetMapping("/api")
    @ResponseBody
    public ResponseEntity<List<ResponseScreeningRoom>> getAllScreeningRooms() {
        return ResponseEntity.ok(screeningRoomService.getAllScreeningRooms());
    }

    // Cập nhật thông tin phòng chiếu và sơ đồ ghế theo ID
    @PutMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<ResponseScreeningRoom> updateRoom(@PathVariable String id,
                                                            @Valid @RequestBody RequestScreeningRoom request) {
        ResponseScreeningRoom response = screeningRoomService.updateScreeningRoom(id, request);
        return ResponseEntity.ok(response);
    }

    // Xóa phòng chiếu khỏi hệ thống theo ID
    @DeleteMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<Void> deleteRoom(@PathVariable String id) {
        screeningRoomService.deleteScreeningRoom(id);
        return ResponseEntity.noContent().build();
    }
}