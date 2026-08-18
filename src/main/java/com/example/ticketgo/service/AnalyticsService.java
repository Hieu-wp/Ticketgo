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
        LocalDate[] range = calculateDateRange(period);
        LocalDate startDate = range[0];
        LocalDate endDate = range[1];

        // Chuẩn hóa bộ lọc: luôn trả về "all" nếu rỗng/null
        String filterRoom = normalizeFilter(roomId);
        String filterMovie = normalizeFilter(movieId);

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

        List<TopMovieRow> topMovies = safeList(analyticsRepository.getTopMovies(startDate, endDate)).stream()
                .map(r -> new TopMovieRow(
                        toStringVal(r, 0),
                        toStringVal(r, 1),
                        toLong(r, 2),
                        toDouble(r, 3)
                ))
                .toList();

        List<RoomDetailRow> roomDetails = safeList(analyticsRepository.getRoomDetails(startDate, endDate)).stream()
                .map(r -> new RoomDetailRow(
                        toStringVal(r, 0),
                        toStringVal(r, 1),
                        toLong(r, 2),
                        toLong(r, 3),
                        toLong(r, 4),
                        toDouble(r, 5)
                ))
                .toList();

        List<RecentTransactionRow> recentTransactions = safeList(
                analyticsRepository.getRecentTransactions(startDate, endDate, filterRoom, filterMovie)
        ).stream()
                .map(r -> new RecentTransactionRow(
                        toStringVal(r, 0),
                        toStringVal(r, 1),
                        toStringVal(r, 2),
                        toStringVal(r, 3),
                        toDouble(r, 4)
                ))
                .toList();

        List<UpcomingShowtimeRow> upcomingShowtimes = safeList(
                analyticsRepository.getUpcomingShowtimes(filterRoom, filterMovie)
        ).stream()
                .map(r -> new UpcomingShowtimeRow(
                        toStringVal(r, 0),
                        toStringVal(r, 1),
                        toStringVal(r, 2),
                        toLong(r, 3),
                        toLong(r, 4)
                ))
                .toList();

        TablesData tables = TablesData.builder()
                .topMovies(topMovies)
                .roomDetails(roomDetails)
                .recentTransactions(recentTransactions)
                .upcomingShowtimes(upcomingShowtimes)
                .build();

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
            case "all" -> startDate = LocalDate.of(2000, 1, 1);
            default -> startDate = today.minusDays(6);
        }
        return new LocalDate[]{startDate, today};
    }

    private String normalizeFilter(String str) {
        if (str == null || str.trim().isEmpty() || "null".equalsIgnoreCase(str.trim())) {
            return "all";
        }
        return str.trim();
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