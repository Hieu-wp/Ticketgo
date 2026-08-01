package com.example.ticketgo.repository;
import com.example.ticketgo.entity.ScreeningRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScreeningRoomRepository extends JpaRepository<ScreeningRoom, String> {

    // 1. Tự động kiểm tra tồn tại theo tên phòng (Chống trùng lặp dữ liệu)
    boolean existsByTenPhong(String tenPhong);

    // 2. Query an toàn bằng Derived Query (Chống SQL Injection)
    Optional<ScreeningRoomRepository> findByTenPhong(String tenPhong);

    // 3. Query an toàn bằng JPQL với Parameterized Query (:sucChua)
    // Giúp tìm các phòng có tổng số ghế lớn hơn hoặc bằng mức yêu cầu
    @Query("SELECT s FROM ScreeningRoom s WHERE s.tongSoGhe >= :capacity")
    List<ScreeningRoom> findPhongChieuSufficientCapacity(@Param("capacity") int capacity);

}
