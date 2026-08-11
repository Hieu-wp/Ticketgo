const API_BASE_URL = '/api';
let currentShowtimeData = null;
let seatDetailsMap = {}; // Map lưu chi tiết vé theo mã ghế

document.addEventListener('DOMContentLoaded', () => {
    initTooltipElement();
    initShowtimeDetailPage();
});

// Helper hiển thị / ẩn Loading
function toggleLoading(show) {
    const loader = document.getElementById('loading-spinner');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// 1. KHỞI TẠO TOOLTIP ELEMENT
function initTooltipElement() {
    if (document.getElementById('seat-hover-tooltip')) return;
    const tooltip = document.createElement('div');
    tooltip.id = 'seat-hover-tooltip';
    tooltip.className = 'seat-hover-tooltip';
    document.body.appendChild(tooltip);
}

// 2. KHỞI TẠO TRANG CHI TIẾT
async function initShowtimeDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const showtimeId = urlParams.get('id');

    if (!showtimeId) {
        alert('Không tìm thấy mã suất chiếu trong đường dẫn!');
        window.history.back();
        return;
    }

    toggleLoading(true); // Hiện loading ngay lập tức

    try {
        const res = await apiRequest(`/counter/seat-map/${showtimeId}`);
        currentShowtimeData = res;

        renderShowtimeDetails(res, showtimeId);
        setupSeatingGridEvents();
    } catch (err) {
        console.error('Lỗi khi tải thông tin suất chiếu:', err);
        alert('Không thể tải thông tin suất chiếu: ' + err.message);
    } finally {
        toggleLoading(false); // Ẩn loading sau khi render xong
    }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi máy chủ (${response.status})`);
    }
    return await response.json();
}

function formatCurrency(n) {
    return new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';
}

function parseRoomLayout(raw) {
    if (!raw) return { rows: 5, cols: 6, hasAisle: false, vipSeats: [], seatCodeMap: {} };

    let obj = raw;
    if (typeof raw === 'string') {
        try { obj = JSON.parse(raw); } catch (e) { obj = {}; }
    }

    let seatArray = [];
    if (Array.isArray(obj)) {
        seatArray = obj;
    } else if (obj && typeof obj === 'object' && Array.isArray(obj.seatLayout)) {
        seatArray = obj.seatLayout;
    }

    let rows = 0, cols = 0;
    let vipSeats = [];
    let seatCodeMap = {};

    if (!Array.isArray(obj) && obj) {
        rows = parseInt(obj.soHangGhe) || 0;
        cols = parseInt(obj.soCotGhe) || 0;
    }

    if (seatArray.length > 0) {
        let maxRowIdx = -1, maxColNum = 0;

        seatArray.forEach(s => {
            let code = s.code;
            let type = s.type;
            let rIdx = -1, cNum = -1;

            if (s.row !== undefined) {
                let rVal = String(s.row).trim().toUpperCase();
                if (/^[A-Z]+$/.test(rVal)) rIdx = rVal.charCodeAt(0) - 65;
                else if (!isNaN(parseInt(rVal))) rIdx = parseInt(rVal) - 1;
            }
            if (s.col !== undefined) cNum = parseInt(s.col);

            if (code && (rIdx < 0 || isNaN(cNum) || cNum < 1)) {
                const cleanCode = String(code).trim().toUpperCase();
                const match = cleanCode.match(/^([A-Z]+)[-_]?(\d+)$/);
                if (match) {
                    rIdx = match[1].charCodeAt(0) - 65;
                    cNum = parseInt(match[2], 10);
                }
            }

            if (rIdx >= 0 && cNum > 0) {
                if (rIdx > maxRowIdx) maxRowIdx = rIdx;
                if (cNum > maxColNum) maxColNum = cNum;
                seatCodeMap[`${rIdx}_${cNum}`] = code;
            }

            if (code && type === 'VIP') {
                vipSeats.push(String(code).trim().toUpperCase());
            }
        });

        if (rows === 0 && maxRowIdx >= 0) rows = maxRowIdx + 1;
        if (cols === 0 && maxColNum > 0) cols = maxColNum;
    }

    if (rows === 0) rows = 5;
    if (cols === 0) cols = 6;

    let hasAisle = false;
    if (!Array.isArray(obj) && obj) {
        hasAisle = obj.coLoiDi === true;
    }

    return { rows, cols, hasAisle, vipSeats, seatCodeMap };
}

// 3. RENDER GIAO DIỆN & TÍNH TỔNG DOANH THU (BAO GỒM BẮP + NƯỚC)
function renderShowtimeDetails(data, showtimeId) {
    const regPrice = data.regularPrice || 80000;
    const vipPrice = data.vipPrice || (regPrice * 1.2);
    const durationStr = data.duration ? `${data.duration} phút` : '120 phút';
    const showTimeStr = (data.startTime || '00:00') + (data.endTime ? ` - ${data.endTime}` : '');

    // Cập nhật thông tin cơ bản
    if (document.getElementById('detail-movie-title')) document.getElementById('detail-movie-title').value = data.movieTitle || 'Chưa cập nhật';
    if (document.getElementById('detail-duration')) document.getElementById('detail-duration').value = durationStr;
    if (document.getElementById('detail-show-date')) document.getElementById('detail-show-date').value = data.showDate || '---';
    if (document.getElementById('detail-show-time')) document.getElementById('detail-show-time').value = showTimeStr;
    if (document.getElementById('detail-room-name')) document.getElementById('detail-room-name').value = data.roomName || '---';
    if (document.getElementById('detail-regular-price')) document.getElementById('detail-regular-price').value = formatCurrency(regPrice);
    if (document.getElementById('detail-vip-price')) document.getElementById('detail-vip-price').value = formatCurrency(vipPrice);
    if (document.getElementById('detail-showtime-code')) document.getElementById('detail-showtime-code').value = `ST-${showtimeId}-${(data.showDate || '').replace(/-/g, '')}-P${data.roomId || '01'}`;

    // TÍNH DOANH THU COMBO BẮP NƯỚC & MAP DỮ LIỆU KHÁCH HÀNG

    seatDetailsMap = {};
    let comboRevenue = 0;
    const countedBookings = new Set();

    if (Array.isArray(data.seatDetails)) {
        data.seatDetails.forEach(d => {
            if (d.seatCode) {
                const key = String(d.seatCode).trim().toUpperCase();
                seatDetailsMap[key] = d;
            }


            if (d.bookingCode && !countedBookings.has(d.bookingCode)) {
                countedBookings.add(d.bookingCode);
                const cPrice = Number(d.comboPrice || 0);
                comboRevenue += cPrice;
            }
        });
    }

    const { rows, cols, hasAisle, vipSeats, seatCodeMap } = parseRoomLayout(data);

    const vipSeatsSet = new Set(vipSeats.map(v => String(v).toUpperCase()));
    const soldSeatsSet = new Set([...(data.soldSeats || []), ...(data.holdingSeats || [])].map(s => String(s).toUpperCase()));
    const reservedSeatsSet = new Set((data.reservedSeats || []).map(s => String(s).toUpperCase()));

    let totalCapacity = 0;
    let totalNormalSeats = 0;
    let totalVipSeats = 0;
    let soldNormalCount = 0;
    let soldVipCount = 0;

    const seatingGrid = document.getElementById('seatingMap');
    if (!seatingGrid) return;

    let finalCols = cols;
    let aisleIndex = -1;
    if (hasAisle && cols > 1) {
        finalCols = cols + 1;
        aisleIndex = Math.floor(cols / 2);
    }

    seatingGrid.style.display = 'grid';
    seatingGrid.style.gridTemplateColumns = `repeat(${finalCols}, auto)`;
    seatingGrid.style.gap = '8px';
    seatingGrid.style.justifyContent = 'center';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let gridHtml = '';

    for (let r = 0; r < rows; r++) {
        const rowLabel = alphabet[r] || `R${r + 1}`;
        let seatNum = 1;

        for (let c = 0; c < finalCols; c++) {
            if (hasAisle && c === aisleIndex) {
                gridHtml += `<div class="aisle-space"></div>`;
                continue;
            }

            totalCapacity++;

            const colLabel = seatNum < 10 ? '0' + seatNum : seatNum;
            const mappedCode = seatCodeMap[`${r}_${seatNum}`];
            const seatId = mappedCode ? String(mappedCode).toUpperCase() : `${rowLabel}${colLabel}`;

            const isVip = vipSeatsSet.has(seatId);
            const isSold = soldSeatsSet.has(seatId);
            const isReserved = reservedSeatsSet.has(seatId);

            if (isVip) {
                totalVipSeats++;
                if (isSold || isReserved) soldVipCount++;
            } else {
                totalNormalSeats++;
                if (isSold || isReserved) soldNormalCount++;
            }

            let seatClass = 'seat-btn';
            let content = seatId;
            let statusAttr = 'NORMAL';

            if (isSold) {
                seatClass += ' sold';
                content = `${seatId} <i class="fa-solid fa-check ms-1" style="font-size:10px;"></i>`;
                statusAttr = 'SOLD';
            } else if (isReserved) {
                seatClass += ' reserved';
                statusAttr = 'RESERVED';
            } else if (isVip) {
                seatClass += ' available-vip';
                statusAttr = 'VIP';
            } else {
                seatClass += ' available-normal';
            }

            gridHtml += `<div class="${seatClass}" data-seat="${seatId}" data-status="${statusAttr}" data-vip="${isVip}">${content}</div>`;
            seatNum++;
        }
    }

    seatingGrid.innerHTML = gridHtml;

    // THỐNG KÊ DOANH THU TỔNG & CHI TIẾT
    const totalSold = soldNormalCount + soldVipCount;
    const fillRate = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

    const normalRevenue = soldNormalCount * regPrice;
    const vipRevenue = soldVipCount * vipPrice;
    const totalRevenue = normalRevenue + vipRevenue + comboRevenue; // TỔNG = Ghế Thường + VIP + Bắp Nước

    if (document.getElementById('detail-capacity-badge')) document.getElementById('detail-capacity-badge').textContent = `Sức chứa: ${totalCapacity} ghế`;
    if (document.getElementById('stat-tickets-count')) document.getElementById('stat-tickets-count').innerHTML = `${totalSold} <small class="fs-6 text-muted fw-normal">/ ${totalCapacity} ghế</small>`;
    if (document.getElementById('stat-fill-percent')) document.getElementById('stat-fill-percent').textContent = `${fillRate}%`;
    if (document.getElementById('stat-progress-bar')) document.getElementById('stat-progress-bar').style.width = `${fillRate}%`;
    if (document.getElementById('stat-normal-tickets')) document.getElementById('stat-normal-tickets').textContent = `${soldNormalCount} / ${totalNormalSeats}`;
    if (document.getElementById('stat-vip-tickets')) document.getElementById('stat-vip-tickets').textContent = `${soldVipCount} / ${totalVipSeats}`;

    // Gán dữ liệu doanh thu ra HTML
    if (document.getElementById('stat-total-revenue')) document.getElementById('stat-total-revenue').textContent = formatCurrency(totalRevenue);
    if (document.getElementById('stat-normal-revenue')) document.getElementById('stat-normal-revenue').textContent = formatCurrency(normalRevenue);
    if (document.getElementById('stat-vip-revenue')) document.getElementById('stat-vip-revenue').textContent = formatCurrency(vipRevenue);
    if (document.getElementById('stat-combo-revenue')) document.getElementById('stat-combo-revenue').textContent = formatCurrency(comboRevenue);
}

// 4. EVENT DELEGATION
function setupSeatingGridEvents() {
    const grid = document.getElementById('seatingMap');
    if (!grid || grid.dataset.hasListener) return;

    grid.dataset.hasListener = 'true';

    grid.addEventListener('mouseover', (e) => {
        const seat = e.target.closest('.seat-btn');
        if (!seat) return;
        showSeatTooltip(e, seat.dataset.seat, seat.dataset.status, seat.dataset.vip === 'true');
    });

    grid.addEventListener('mousemove', moveSeatTooltip);

    grid.addEventListener('mouseout', (e) => {
        if (e.target.closest('.seat-btn')) hideSeatTooltip();
    });

    grid.addEventListener('click', (e) => {
        const seat = e.target.closest('.seat-btn');
        if (!seat) return;

        const status = seat.dataset.status;
        if (status === 'SOLD' || status === 'RESERVED') {
            handleSeatClick(seat.dataset.seat, seat.dataset.vip === 'true', status);
        }
    });
}

// 5. TOOLTIP HOVER
function showSeatTooltip(evt, seatId, status, isVip) {
    const tooltip = document.getElementById('seat-hover-tooltip');
    if (!tooltip) return;

    const seatType = isVip ? 'Ghế VIP' : 'Ghế Thường';
    let statusText = 'Ghế trống';
    let statusColor = '#38bdf8';

    if (status === 'SOLD') {
        statusText = 'Đã bán / Thanh toán';
        statusColor = '#ef4444';
    } else if (status === 'RESERVED') {
        statusText = 'Đã đặt chỗ';
        statusColor = '#f59e0b';
    }

    const info = seatDetailsMap[seatId] || {};
    const roomName = currentShowtimeData?.roomName || 'N/A';
    const movieTitle = currentShowtimeData?.movieTitle || 'N/A';
    const showtimeStr = `${currentShowtimeData?.startTime || ''} (${currentShowtimeData?.showDate || ''})`;

    let detailsHtml = `
      <div style="font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px; font-size: 0.9rem; color: #f8fafc;">
        <i class="fa-solid fa-couch me-1"></i> Ghế: ${seatId} <span style="font-size:0.75rem; font-weight:normal; color:#cbd5e1;">(${seatType})</span>
      </div>
      <div><b>Trạng thái:</b> <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
      <div><b>Phòng chiếu:</b> ${roomName}</div>
      <div><b>Phim:</b> ${movieTitle}</div>
      <div><b>Suất chiếu:</b> ${showtimeStr}</div>
    `;

    if (status === 'SOLD' || status === 'RESERVED') {
        detailsHtml += `
        <div style="margin-top: 6px; border-top: 1px dashed #475569; padding-top: 6px; color: #f1f5f9;">
          <div><b>Khách hàng:</b> ${info.customerName || 'Đã bán'}</div>
          <div><b>SĐT:</b> ${info.customerPhone || 'N/A'}</div>
          ${info.comboName ? `<div><b>Combo:</b> <span style="color:#facc15;">${info.comboName}</span></div>` : ''}
          ${info.ticketCode ? `<div><b>Mã vé:</b> <span style="color:#a78bfa; font-weight:bold;">${info.ticketCode}</span></div>` : ''}
        </div>
      `;
    }

    tooltip.innerHTML = detailsHtml;
    tooltip.classList.add('active');
    moveSeatTooltip(evt);
}

function moveSeatTooltip(evt) {
    const tooltip = document.getElementById('seat-hover-tooltip');
    if (!tooltip || !tooltip.classList.contains('active')) return;

    const tooltipWidth = tooltip.offsetWidth || 240;
    const tooltipHeight = tooltip.offsetHeight || 160;

    let x = evt.clientX + 14;
    let y = evt.clientY + 14;

    if (y + tooltipHeight > window.innerHeight - 10) y = evt.clientY - tooltipHeight - 10;
    if (x + tooltipWidth > window.innerWidth - 10) x = evt.clientX - tooltipWidth - 10;
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function hideSeatTooltip() {
    const tooltip = document.getElementById('seat-hover-tooltip');
    if (tooltip) tooltip.classList.remove('active');
}

// 6. MODAL CHI TIẾT ĐẶT VÉ
function handleSeatClick(seatId, isVip, status) {
    if (!currentShowtimeData) return;

    const ticketInfo = seatDetailsMap[seatId] || {};
    const regPrice = currentShowtimeData.regularPrice || 80000;
    const seatPrice = isVip ? (currentShowtimeData.vipPrice || regPrice * 1.2) : regPrice;

    const custName = ticketInfo.customerName
        ? `${ticketInfo.customerName} (${ticketInfo.customerPhone || 'N/A'})`
        : 'Đã mua vé';

    const displayInfo = {
        ticketCode: ticketInfo.ticketCode || 'N/A',
        orderCode: ticketInfo.bookingCode || 'N/A',
        customerName: custName,
        seatDisplay: `${seatId} (${isVip ? 'VIP' : 'Thường'})`,
        roomName: currentShowtimeData.roomName || 'Phòng chiếu',
        movieTitle: currentShowtimeData.movieTitle || 'N/A',
        showtimeFull: `${currentShowtimeData.startTime || ''} ${currentShowtimeData.showDate || ''}`,
        comboInfo: ticketInfo.comboName ? `${ticketInfo.comboName} (${formatCurrency(ticketInfo.comboPrice)})` : 'Không sử dụng combo',
        seatPrice: formatCurrency(ticketInfo.ticketPrice || seatPrice),
        totalPrice: formatCurrency(ticketInfo.totalAmount || (seatPrice + (ticketInfo.comboPrice || 0))),
        statusText: status === 'RESERVED' ? 'Vé đã đặt trước' : 'Vé đã thanh toán'
    };

    openTicketDetailModal(displayInfo);
}

function openTicketDetailModal(info) {
    let modalElem = document.getElementById('ticketDetailModal');

    if (!modalElem) {
        const modalHtml = `
        <div class="modal fade" id="ticketDetailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
                <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                    <div class="modal-header text-white px-4 py-3" style="background: #2563eb;">
                        <h6 class="modal-title fw-bold mb-0 d-flex align-items-center">
                            <i class="fa-solid fa-circle-info me-2"></i>Thông Tin Đặt Vé
                        </h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4 bg-white">
                        <div class="text-center mb-4">
                            <div class="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-2" style="width: 48px; height: 48px;">
                                <i class="fa-solid fa-check fs-4"></i>
                            </div>
                            <h5 id="m-status-text" class="fw-bold text-success mb-0">Vé đã thanh toán</h5>
                        </div>

                        <div class="row g-3 fs-6">
                            <div class="col-6">
                                <span class="text-muted d-block small">Mã vé</span>
                                <strong id="m-ticket-code" class="text-primary fs-5">---</strong>
                            </div>
                            <div class="col-6">
                                <span class="text-muted d-block small">Mã đơn</span>
                                <strong id="m-order-code" class="text-primary fs-5">---</strong>
                            </div>

                            <div class="col-6">
                                <span class="text-muted d-block small">Khách hàng</span>
                                <strong id="m-customer" class="text-dark">---</strong>
                            </div>
                            <div class="col-6">
                                <span class="text-muted d-block small">Ghế</span>
                                <strong id="m-seat" class="text-dark">---</strong>
                            </div>

                            <div class="col-6">
                                <span class="text-muted d-block small">Phòng chiếu</span>
                                <strong id="m-room" class="text-dark">---</strong>
                            </div>
                            <div class="col-6">
                                <span class="text-muted d-block small">Phim</span>
                                <strong id="m-movie" class="text-dark">---</strong>
                            </div>

                            <div class="col-12">
                                <span class="text-muted d-block small">Suất chiếu</span>
                                <strong id="m-showtime" class="text-dark">---</strong>
                            </div>

                            <div class="col-12">
                                <div class="p-3 rounded-3 bg-light border border-dashed">
                                    <span id="m-combo" class="fw-semibold text-secondary small d-block">---</span>
                                </div>
                            </div>

                            <div class="col-6">
                                <span class="text-muted d-block small">Giá vé ghế</span>
                                <strong id="m-seat-price" class="text-dark">---</strong>
                            </div>
                            <div class="col-6">
                                <span class="text-muted d-block small">Tổng đơn hàng</span>
                                <strong id="m-total-price" class="text-success fs-5">---</strong>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-end gap-2 border-top-0">
                        <button type="button" class="btn btn-emerald text-white bg-success border-0 px-4 fw-semibold rounded-3" onclick="window.print()">
                            <i class="fa-solid fa-print me-1.5"></i>In phiếu vé
                        </button>
                        <button type="button" class="btn btn-primary px-4 fw-semibold rounded-3" data-bs-dismiss="modal">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalElem = document.getElementById('ticketDetailModal');
    }

    document.getElementById('m-status-text').textContent = info.statusText;
    document.getElementById('m-ticket-code').textContent = info.ticketCode;
    document.getElementById('m-order-code').textContent = info.orderCode;
    document.getElementById('m-customer').textContent = info.customerName;
    document.getElementById('m-seat').textContent = info.seatDisplay;
    document.getElementById('m-room').textContent = info.roomName;
    document.getElementById('m-movie').textContent = info.movieTitle;
    document.getElementById('m-showtime').textContent = info.showtimeFull;
    document.getElementById('m-combo').textContent = info.comboInfo;
    document.getElementById('m-seat-price').textContent = info.seatPrice;
    document.getElementById('m-total-price').textContent = info.totalPrice;

    const bsModal = new bootstrap.Modal(modalElem);
    bsModal.show();
}