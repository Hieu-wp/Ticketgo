package com.example.ticketgo.service;

import com.example.ticketgo.dto.response.DashboardAnalyticsDTO;
import com.example.ticketgo.dto.response.DashboardAnalyticsDTO.*;
import com.example.ticketgo.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    public DashboardAnalyticsDTO getDashboardData(String period, String roomId, String movieId) {
        // 1. Tính toán khoảng thời gian lọc
        LocalDate[] range = calculateDateRange(period);
        LocalDate startDate = range[0];
        LocalDate endDate = range[1];

        // 2. Chuẩn hóa giá trị lọc ("all" hoặc rỗng -> null)
        String filterRoom = isNullOrAll(roomId) ? null : roomId;
        String filterMovie = isNullOrAll(movieId) ? null : movieId;

        // 3. Lấy dữ liệu KPI (Lấy index 4 là activeMovies từ SQL)
        List<Object[]> kpiRows = analyticsRepository.getKpiSummary(startDate, endDate, filterRoom, filterMovie);
        Object[] kpiResult = (kpiRows != null && !kpiRows.isEmpty()) ? kpiRows.get(0) : new Object[7];

        KpiSummary kpi = KpiSummary.builder()
                .totalRevenue(toDouble(kpiResult, 0))
                .ticketsSold(toLong(kpiResult, 1))
                .totalCustomers(toLong(kpiResult, 2))
                .totalBookings(toLong(kpiResult, 3))
                .activeMovies(toLong(kpiResult, 4))
                .comboRevenue(toDouble(kpiResult, 5))
                .totalShows(toLong(kpiResult, 6))
                .build();

        // 4. Lấy dữ liệu các biểu đồ (Charts)
        boolean isSingleDay = period != null && (period.equalsIgnoreCase("1d") || period.equalsIgnoreCase("today"));

        List<Object[]> revenueRows = isSingleDay
                ? analyticsRepository.getHourlyRevenue(startDate, endDate, filterRoom, filterMovie)
                : analyticsRepository.getDailyRevenue(startDate, endDate, filterRoom, filterMovie);

        List<DailyRevenue> dailyRevenue = safeList(revenueRows).stream()
                .map(r -> new DailyRevenue(toStringVal(r, 0), toDouble(r, 1)))
                .toList();

        List<LabelValue> movieRatio = safeList(analyticsRepository.getMovieRevenueRatio(startDate, endDate, filterRoom)).stream()
                .map(r -> new LabelValue(toStringVal(r, 0), toDouble(r, 1)))
                .toList();

        List<HourlyTicket> hourlyTickets = safeList(analyticsRepository.getHourlyTickets(startDate, endDate, filterRoom, filterMovie)).stream()
                .map(r -> new HourlyTicket(toStringVal(r, 0), toLong(r, 1)))
                .toList();

        List<LabelValue> seatRatio = safeList(analyticsRepository.getSeatTypeRatio(startDate, endDate, filterRoom, filterMovie)).stream()
                .map(r -> new LabelValue(toStringVal(r, 0), toLong(r, 1)))
                .toList();

        List<LabelValue> topCombos = safeList(analyticsRepository.getTopCombos(startDate, endDate)).stream()
                .map(r -> new LabelValue(toStringVal(r, 0), toLong(r, 1)))
                .toList();

        ChartsData charts = ChartsData.builder()
                .dailyRevenue(dailyRevenue)
                .movieRevenueRatio(movieRatio)
                .hourlyTickets(hourlyTickets)
                .seatTypeRatio(seatRatio)
                .topCombos(topCombos)
                .build();

        // 5. Lấy dữ liệu các bảng (Tables)
        List<TopMovieRow> topMovies = safeList(analyticsRepository.getTopMovies(startDate, endDate)).stream()
                .map(r -> new TopMovieRow(
                        toStringVal(r, 0), // m.id
                        toStringVal(r, 1), // m.title
                        toLong(r, 2),      // ticketsSold
                        toDouble(r, 3)     // totalRevenue
                ))
                .toList();

        List<RoomDetailRow> roomDetails = safeList(analyticsRepository.getRoomDetails(startDate, endDate)).stream()
                .map(r -> new RoomDetailRow(
                        toStringVal(r, 0), // roomId
                        toStringVal(r, 1), // roomName
                        toLong(r, 2),      // totalSeats
                        toLong(r, 3),      // totalShows
                        toLong(r, 4),      // ticketsSold
                        toDouble(r, 5)     // totalRevenue
                ))
                .toList();

        List<RecentTransactionRow> recentTransactions = safeList(analyticsRepository.getRecentTransactions()).stream()
                .map(r -> new RecentTransactionRow(
                        toStringVal(r, 0), // code
                        toStringVal(r, 1), // time
                        toStringVal(r, 2), // customer
                        toStringVal(r, 3), // movie
                        toDouble(r, 4)     // total
                ))
                .toList();

        List<UpcomingShowtimeRow> upcomingShowtimes = safeList(analyticsRepository.getUpcomingShowtimes()).stream()
                .map(r -> new UpcomingShowtimeRow(
                        toStringVal(r, 0), // time
                        toStringVal(r, 1), // movie
                        toStringVal(r, 2), // room
                        toLong(r, 3),      // sold
                        toLong(r, 4)       // total
                ))
                .toList();

        TablesData tables = TablesData.builder()
                .topMovies(topMovies)
                .roomDetails(roomDetails)
                .recentTransactions(recentTransactions)
                .upcomingShowtimes(upcomingShowtimes)
                .build();

        // 6. Gom kết quả vào DTO chính
        return DashboardAnalyticsDTO.builder()
                .kpi(kpi)
                .charts(charts)
                .tables(tables)
                .build();
    }

    private LocalDate[] calculateDateRange(String period) {
        LocalDate today = LocalDate.now();
        LocalDate startDate;

        if (period == null) {
            period = "7d";
        }

        switch (period.toLowerCase()) {
            case "1d", "today" -> startDate = today;
            case "30d" -> startDate = today.minusDays(29);
            case "month" -> startDate = today.withDayOfMonth(1);
            case "1y", "year" -> startDate = today.withDayOfYear(1);
            default -> startDate = today.minusDays(6);
        }
        return new LocalDate[]{startDate, today};
    }

    private boolean isNullOrAll(String str) {
        return str == null || str.trim().isEmpty() || "all".equalsIgnoreCase(str.trim());
    }

    private <T> List<T> safeList(List<T> list) {
        return list == null ? Collections.emptyList() : list;
    }

    private double toDouble(Object[] row, int index) {
        if (row != null && index >= 0 && index < row.length && row[index] instanceof Number num) {
            return num.doubleValue();
        }
        return 0.0;
    }

    private long toLong(Object[] row, int index) {
        if (row != null && index >= 0 && index < row.length && row[index] instanceof Number num) {
            return num.longValue();
        }
        return 0L;
    }

    private String toStringVal(Object[] row, int index) {
        if (row != null && index >= 0 && index < row.length && row[index] != null) {
            return row[index].toString();
        }
        return "-";
    }
}