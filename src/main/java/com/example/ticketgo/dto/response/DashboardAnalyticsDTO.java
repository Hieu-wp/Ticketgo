package com.example.ticketgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsDTO {

    private KpiSummary kpi;
    private ChartsData charts;
    private TablesData tables;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiSummary {
        private double totalRevenue;
        private long ticketsSold;
        private long totalCustomers;
        private long totalBookings;
        private long activeMovies;
        private double comboRevenue;
        private long totalShows;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartsData {
        private List<DailyRevenue> dailyRevenue;
        private List<LabelValue> movieRevenueRatio;
        private List<HourlyTicket> hourlyTickets;
        private List<LabelValue> seatTypeRatio;
        private List<LabelValue> topCombos;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TablesData {
        private List<TopMovieRow> topMovies;
        private List<RoomDetailRow> roomDetails;
        private List<RecentTransactionRow> recentTransactions;
        private List<UpcomingShowtimeRow> upcomingShowtimes;
    }

    // Các Record định dạng dữ liệu con
    public record DailyRevenue(String date, double totalAmount) {}
    public record LabelValue(String label, Object value) {}
    public record HourlyTicket(String timeSlot, long ticketCount) {}
    public record TopMovieRow(String id, String title, long ticketsSold, double totalRevenue) {}
    public record RoomDetailRow(String roomId, String roomName, long totalSeats, long totalShows, long ticketsSold, double totalRevenue) {}
    public record RecentTransactionRow(String code, String time, String customer, String movie, double total) {}
    public record UpcomingShowtimeRow(String time, String movie, String room, long sold, long total) {}
}