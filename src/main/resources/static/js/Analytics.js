// Biến toàn cục lưu trữ instance biểu đồ và dữ liệu cache
let chartRevenueInstance = null;
let chartMoviePieInstance = null;
let chartHourlyInstance = null;
let chartMovieRevenueInstance = null;
let chartSeatTypeInstance = null;
let chartComboInstance = null;

let cachedAnalyticsData = null;

// Tự động khởi chạy khi trang web tải xong
document.addEventListener('DOMContentLoaded', () => {
    loadFilterOptions();
    applyFilters();
});

// -------------------------------------------------------------
// 1. TẢI DANH SÁCH DROPDOWN BỘ LỌC (PHÒNG & PHIM)
// -------------------------------------------------------------
async function loadFilterOptions() {
    try {
        const roomRes = await fetch('/api/rooms');
        if (roomRes.ok) {
            const rawData = await roomRes.json();
            const rooms = Array.isArray(rawData) ? rawData : (rawData.data || rawData.result || rawData.content || []);
            const roomSelect = document.getElementById('filter-room');
            if (roomSelect && Array.isArray(rooms)) {
                roomSelect.innerHTML = '<option value="all">Tất cả phòng</option>';
                rooms.forEach(room => {
                    roomSelect.innerHTML += `<option value="${room.id}">${room.tenPhong || room.roomName || room.name || room.id}</option>`;
                });
            }
        }
    } catch (e) {
        console.warn("Không thể tải danh sách phòng chiếu:", e);
    }

    try {
        const movieRes = await fetch('/api/movies');
        if (movieRes.ok) {
            const rawData = await movieRes.json();
            const movies = Array.isArray(rawData) ? rawData : (rawData.data || rawData.result || rawData.content || []);
            const movieSelect = document.getElementById('filter-movie');
            const movieRevenueSelect = document.getElementById('movie-revenue-select');

            if (Array.isArray(movies)) {
                if (movieSelect) movieSelect.innerHTML = '<option value="all">Tất cả phim</option>';
                if (movieRevenueSelect) movieRevenueSelect.innerHTML = '<option value="all">Tất cả phim</option>';

                movies.forEach(movie => {
                    const optionHtml = `<option value="${movie.id}">${movie.title || movie.tenPhim || movie.name}</option>`;
                    if (movieSelect) movieSelect.innerHTML += optionHtml;
                    if (movieRevenueSelect) movieRevenueSelect.innerHTML += optionHtml;
                });
            }
        }
    } catch (e) {
        console.warn("Không thể tải danh sách phim:", e);
    }
}

// -------------------------------------------------------------
// 2. HÀM CHÍNH: LỌC & KẾT NỐI API BACKEND
// -------------------------------------------------------------
async function applyFilters() {
    const period = document.getElementById('filter-period')?.value || '7d';
    const roomId = document.getElementById('filter-room')?.value || 'all';
    const movieId = document.getElementById('filter-movie')?.value || 'all';

    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang tải...';
    }

    try {
        const response = await fetch(`/api/analytics?period=${period}&roomId=${roomId}&movieId=${movieId}`);
        if (!response.ok) throw new Error('Không thể lấy dữ liệu từ Server');

        const data = await response.json();
        cachedAnalyticsData = data;

        // 1. Cập nhật KPI
        updateKPIs(data.kpi);

        // 2. Cập nhật Biểu đồ
        if (typeof Chart === 'undefined') {
            console.error("LỖI: Chưa nạp thư viện Chart.js trong HTML!");
        } else {
            renderCharts(data.charts || {}, period);
        }

        // 3. Cập nhật Bảng dữ liệu
        renderTables(data.tables || {});

        // Cập nhật thời gian
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString('vi-VN');

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
    } finally {
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.innerHTML = '<i class="fa-solid fa-rotate me-1"></i> Làm mới';
        }
    }
}

// 3. CẬP NHẬT THẺ KPI (SỬA LỖI ĐẾM SỐ PHIM ĐANG CHIẾU)

function updateKPIs(kpi) {
    if (!kpi) return;
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setTxt('kpi-revenue', fmtMoney(kpi.totalRevenue || 0));
    setTxt('kpi-tickets', fmtNumber(kpi.ticketsSold || 0));
    setTxt('kpi-customers', fmtNumber(kpi.totalCustomers || 0));
    setTxt('kpi-combo', fmtMoney(kpi.comboRevenue || 0));
    // Chỉ đếm activeMovies (hoặc totalMovies), không đếm totalBookings hay totalShows
    setTxt('kpi-movies', fmtNumber(kpi.activeMovies ?? kpi.totalMovies ?? 0));
    setTxt('kpi-shows', fmtNumber(kpi.totalShows || 0));
}

// Mảng màu phân biệt rõ ràng cho các phim
const MOVIE_COLORS = ['#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#eab308', '#10b981', '#3b82f6'];

// Rút gọn số tiền trên trục Y (Tự động co giãn theo giá trị thực tế)
function formatAxisValue(value) {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'tỷ';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'tr';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
    return value;
}

const commonScales = {
    x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter' } }
    },
    y: {
        grid: { color: 'rgba(241, 245, 249, 1)' },
        border: { display: false },
        beginAtZero: true,
        ticks: {
            color: '#94a3b8',
            font: { size: 11, family: 'Inter' },
            callback: (val) => formatAxisValue(val)
        }
    }
};


// 4. VẼ BIỂU ĐỒ ĐỘNG

function renderCharts(charts, period) {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

    runSafe(() => renderRevenueChart(charts.dailyRevenue || [], period), "Biểu đồ Doanh thu");
    runSafe(() => renderMoviePieChart(charts.movieRevenueRatio || []), "Biểu đồ Tỷ lệ phim");
    runSafe(() => renderHourlyChart(charts.hourlyTickets || []), "Biểu đồ Khung giờ");
    runSafe(() => renderMovieRevenueChart(charts.movieRevenueRatio || []), "Biểu đồ Doanh thu từng phim");
    runSafe(() => renderSeatTypeChart(charts.seatTypeRatio || []), "Biểu đồ Loại ghế");
    runSafe(() => renderComboChart(charts.topCombos || []), "Biểu đồ Top Combo");
}

function runSafe(fn, name) {
    try { fn(); } catch (e) { console.warn(`Lỗi [${name}]:`, e); }
}

// 1. Biểu đồ Doanh thu (Gom mốc thời gian chuẩn theo period)
function renderRevenueChart(dailyData, period) {
    const canvas = document.getElementById('chartRevenue');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartRevenueInstance) chartRevenueInstance.destroy();

    let labels = [];
    let totals = [];
    const p = (period || '7d').toLowerCase();
    const items = Array.isArray(dailyData) ? dailyData : [];

    if (p === '1d' || p === 'today') {
        // HÔM NAY: Chia 24 khung giờ từ 00:00 đến 23:00
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        totals = new Array(24).fill(0);

        items.forEach(i => {
            const rawTime = String(i.timeSlot || i.date || i.hour || '');
            const match = rawTime.match(/(\d{1,2}):\d{2}/) || rawTime.match(/(\d{1,2})h/);
            const val = (i.totalAmount ?? i.revenue ?? i.value ?? 0);

            if (match) {
                const hour = parseInt(match[1], 10);
                if (hour >= 0 && hour < 24) totals[hour] += val;
            } else if (!isNaN(parseInt(rawTime, 10)) && parseInt(rawTime, 10) >= 0 && parseInt(rawTime, 10) < 24) {
                totals[parseInt(rawTime, 10)] += val;
            }
        });

    } else if (p === '7d') {
        // 7 NGÀY: Lấy 7 ngày gần nhất tính đến hôm nay
        const dateKeys = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            dateKeys.push({ full: `${yyyy}-${mm}-${dd}`, display: `${dd}/${mm}` });
        }

        labels = dateKeys.map(d => d.display);
        totals = new Array(7).fill(0);

        items.forEach(i => {
            const dateStr = String(i.date || i.dateStr || i.label || '');
            const foundIdx = dateKeys.findIndex(k => dateStr.includes(k.full) || dateStr.includes(k.display));
            const val = (i.totalAmount ?? i.revenue ?? i.value ?? 0);
            if (foundIdx !== -1) totals[foundIdx] += val;
        });

    } else if (p === '30d' || p === 'month') {
        // THÁNG: Chia 4 mốc tuần
        labels = ['Tuần 1 (1-7)', 'Tuần 2 (8-14)', 'Tuần 3 (15-21)', 'Tuần 4 (22-cuối)'];
        totals = [0, 0, 0, 0];

        items.forEach(i => {
            const val = (i.totalAmount ?? i.revenue ?? i.value ?? 0);
            const labelStr = String(i.label || i.date || '');

            if (labelStr.includes('Tuần 1') || labelStr.includes('W1')) totals[0] += val;
            else if (labelStr.includes('Tuần 2') || labelStr.includes('W2')) totals[1] += val;
            else if (labelStr.includes('Tuần 3') || labelStr.includes('W3')) totals[2] += val;
            else if (labelStr.includes('Tuần 4') || labelStr.includes('W4')) totals[3] += val;
            else {
                const parts = labelStr.split('-');
                if (parts.length >= 3) {
                    const day = parseInt(parts[2], 10);
                    if (day <= 7) totals[0] += val;
                    else if (day <= 14) totals[1] += val;
                    else if (day <= 21) totals[2] += val;
                    else if (day > 21) totals[3] += val;
                }
            }
        });

    } else if (p === '1y' || p === 'year') {
        // NĂM: 12 Tháng
        labels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
        totals = new Array(12).fill(0);

        items.forEach(i => {
            const val = (i.totalAmount ?? i.revenue ?? i.value ?? 0);
            const labelStr = String(i.label || i.date || '');
            const matchMonth = labelStr.match(/Tháng\s*(\d{1,2})/i);

            if (matchMonth) {
                const m = parseInt(matchMonth[1], 10) - 1;
                if (m >= 0 && m < 12) totals[m] += val;
            } else {
                const parts = labelStr.split('-');
                if (parts.length >= 2) {
                    const m = parseInt(parts[1], 10) - 1;
                    if (m >= 0 && m < 12) totals[m] += val;
                }
            }
        });
    } else {
        labels = items.map(i => i.date || i.label || '-');
        totals = items.map(i => i.totalAmount ?? i.value ?? 0);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');

    chartRevenueInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: totals,
                borderColor: '#8b5cf6',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: totals.length > 20 ? 2 : 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: commonScales
        }
    });
}

// 2. Biểu đồ Tỷ lệ doanh thu theo phim
function renderMoviePieChart(movieRatio) {
    const canvas = document.getElementById('chartMoviePie');
    if (!canvas) return;
    if (chartMoviePieInstance) chartMoviePieInstance.destroy();

    const labels = movieRatio.map(i => i.label || i.movieName || i.title || 'Khác');
    const values = movieRatio.map(i => i.value ?? i.totalRevenue ?? i.revenue ?? 0);

    chartMoviePieInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Chưa có dữ liệu'],
            datasets: [{
                data: values.length ? values : [0],
                backgroundColor: labels.length ? MOVIE_COLORS : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'rect', boxWidth: 10, padding: 15, color: '#64748b', font: { size: 11 } }
                }
            }
        }
    });
}

// 3. Biểu đồ Vé bán theo khung giờ
function renderHourlyChart(hourlyData) {
    const canvas = document.getElementById('chartHourly');
    if (!canvas) return;
    if (chartHourlyInstance) chartHourlyInstance.destroy();

    const labels = hourlyData.map(i => i.timeSlot || i.label || i.hour);
    const values = hourlyData.map(i => i.ticketCount ?? i.value ?? i.tickets ?? 0);

    chartHourlyInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số vé bán',
                data: values,
                backgroundColor: '#a855f7',
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: commonScales
        }
    });
}

// 4. Biểu đồ Doanh thu từng phim
function renderMovieRevenueChart(movieRatio) {
    const canvas = document.getElementById('chartMovieRevenue');
    if (!canvas) return;
    if (chartMovieRevenueInstance) chartMovieRevenueInstance.destroy();

    const labels = movieRatio.map(i => i.label || i.movieName || i.title);
    const values = movieRatio.map(i => i.value ?? i.totalRevenue ?? i.revenue ?? 0);

    chartMovieRevenueInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: values,
                backgroundColor: '#a855f7',
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: commonScales
        }
    });
}

// 5. Biểu đồ Loại ghế
function renderSeatTypeChart(seatData) {
    const canvas = document.getElementById('chartSeatType');
    if (!canvas) return;
    if (chartSeatTypeInstance) chartSeatTypeInstance.destroy();

    const labels = seatData.map(i => i.label || i.seatType);
    const values = seatData.map(i => i.value ?? i.count ?? 0);

    chartSeatTypeInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: labels.length ? labels : ['Chưa có dữ liệu'],
            datasets: [{
                data: values.length ? values : [0],
                backgroundColor: labels.length ? ['#8b5cf6', '#f59e0b', '#06b6d4'] : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// 6. Biểu đồ Top Combo
function renderComboChart(comboData) {
    const canvas = document.getElementById('chartCombo');
    if (!canvas) return;
    if (chartComboInstance) chartComboInstance.destroy();

    const labels = comboData.map(i => i.label || i.comboName || i.name);
    const values = comboData.map(i => i.value ?? i.quantity ?? i.totalQuantity ?? 0);

    chartComboInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng',
                data: values,
                backgroundColor: '#ec4899',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: commonScales
        }
    });
}

// -------------------------------------------------------------
// 5. HIỂN THỊ DỮ LIỆU BẢNG
// -------------------------------------------------------------
function renderTables(tables) {
    if (!tables) return;

    // Bảng 1: Top Phim Doanh Thu
    runSafe(() => {
        const topMoviesBody = document.getElementById('table-top-movies');
        if (topMoviesBody) {
            const list = tables.topMovies || tables.topPhim || tables.movies || [];
            topMoviesBody.innerHTML = list.length === 0
                ? '<tr><td colspan="5" class="text-center text-muted py-3">Không có dữ liệu phim</td></tr>'
                : list.map((m, i) => {
                    const name = m.title || m.tenPhim || m.movieName || m.name || '-';
                    const tickets = m.ticketsSold ?? m.soVe ?? m.soVeBan ?? m.quantity ?? m.ticketCount ?? 0;
                    const revenue = m.totalRevenue ?? m.doanhThu ?? m.totalAmount ?? m.revenue ?? 0;
                    const rate = m.occupancyRate ? (m.occupancyRate + '%') : (tickets > 0 ? 'Cao' : 'Trung bình');

                    return `
                        <tr>
                            <td><strong style="color:#7c3aed;">${i + 1}</strong></td>
                            <td class="fw-medium">${name}</td>
                            <td>${fmtNumber(tickets)}</td>
                            <td class="fw-semibold text-dark">${fmtMoney(revenue)}</td>
                            <td><span class="badge bg-success-subtle text-success px-2 py-1 rounded">${rate}</span></td>
                        </tr>
                    `;
                }).join('');
        }
    }, "Bảng Top Phim");

    // Bảng 2: Chi tiết Phòng chiếu
    runSafe(() => {
        const roomsBody = document.getElementById('table-rooms');
        if (roomsBody) {
            const list = tables.roomDetails || tables.chiTietPhong || tables.rooms || [];
            roomsBody.innerHTML = list.length === 0
                ? '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu phòng chiếu</td></tr>'
                : list.map(r => {
                    const roomName = r.roomName || r.tenPhong || r.name || '-';
                    const seats = r.totalSeats ?? r.soGhe ?? r.capacity ?? r.soLuongGhe ?? '-';
                    const shows = r.totalShows ?? r.soSuatChieu ?? r.showsCount ?? 0;
                    const tickets = r.ticketsSold ?? r.soVeBan ?? r.soVe ?? 0;
                    const revenue = r.totalRevenue ?? r.doanhThu ?? r.totalAmount ?? 0;

                    let occupancy = '-';
                    if (typeof seats === 'number' && seats > 0 && shows > 0) {
                        const totalCapacity = seats * shows;
                        occupancy = Math.round((tickets / totalCapacity) * 100) + '%';
                    } else if (r.occupancyRate || r.congSuat) {
                        occupancy = (r.occupancyRate || r.congSuat) + '%';
                    }

                    return `
                        <tr>
                            <td><span class="badge-soft badge-purple px-2 py-1">${roomName}</span></td>
                            <td>${seats}</td>
                            <td>${shows}</td>
                            <td>${fmtNumber(tickets)}</td>
                            <td>${occupancy}</td>
                            <td class="fw-semibold text-dark">${fmtMoney(revenue)}</td>
                        </tr>
                    `;
                }).join('');
        }
    }, "Bảng Phòng chiếu");

    // Bảng 3: Giao dịch gần đây
    runSafe(() => {
        const transactionsBody = document.getElementById('table-transactions');
        if (transactionsBody) {
            const list = tables.recentTransactions || tables.giaoDich || tables.transactions || [];
            transactionsBody.innerHTML = list.length === 0
                ? '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu giao dịch</td></tr>'
                : list.map(t => {
                    const code = t.code || t.maGD || t.maGiaoDich || t.id || '-';
                    const time = t.time || t.thoiGian || t.createdAt || '-';
                    const customer = t.customer || t.tenKhachHang || t.customerName || 'Khách vãng lai';
                    const movie = t.movie || t.tenPhim || '-';
                    const seat = t.seats || t.ghe || t.danhSachGhe || '';
                    const combo = t.combo || t.tenCombo || 'Không';
                    const total = t.total || t.tongTien || t.totalAmount || 0;

                    return `
                        <tr>
                            <td><strong>${code}</strong></td>
                            <td>${time}</td>
                            <td>${customer}</td>
                            <td>${movie} ${seat ? `<small class="text-muted">(${seat})</small>` : ''}</td>
                            <td>${combo}</td>
                            <td class="fw-semibold text-dark">${fmtMoney(total)}</td>
                        </tr>
                    `;
                }).join('');
        }
    }, "Bảng Giao dịch");

    // Bảng 4: Suất chiếu sắp tới
    runSafe(() => {
        const upcomingBody = document.getElementById('table-upcoming');
        if (upcomingBody) {
            const list = tables.upcomingShowtimes || tables.suatChieu || tables.upcoming || [];
            upcomingBody.innerHTML = list.length === 0
                ? '<tr><td colspan="5" class="text-center text-muted py-3">Không có suất chiếu sắp tới</td></tr>'
                : list.map(s => {
                    const time = s.time || s.gioChieu || s.startTime || '-';
                    const movie = s.movie || s.tenPhim || '-';
                    const room = s.room || s.tenPhong || '-';
                    const sold = s.sold ?? s.veDaBan ?? s.ticketsSold ?? 0;
                    const total = s.total ?? s.tongGhe ?? s.capacity ?? 0;
                    const remaining = s.available ?? s.conLai ?? (total > 0 ? Math.max(0, total - sold) : '-');

                    return `
                        <tr>
                            <td><strong class="text-primary">${time}</strong></td>
                            <td class="fw-medium">${movie}</td>
                            <td>${room}</td>
                            <td><span class="text-success fw-bold">${sold}</span></td>
                            <td><span class="text-muted">${remaining}</span></td>
                        </tr>
                    `;
                }).join('');
        }
    }, "Bảng Suất chiếu");
}

// -------------------------------------------------------------
// 6. TIỆN ÍCH ĐỊNH DẠNG (FORMATTERS)
// -------------------------------------------------------------
function fmtMoney(amount) {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function fmtNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
}