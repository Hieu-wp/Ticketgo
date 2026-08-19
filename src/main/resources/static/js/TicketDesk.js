const API_BASE_URL = '/api';

let state = {
  selectedMovie: null,
  selectedShowtime: null,
  selectedCombo: null,
  selectedSeats: [],
  seatLayout: null,
  occupiedSeats: [],
  occupiedDetails: {},
  highlightSeat: null,
  appliedPromo: null
};

/* =========================================================
   COMMON
========================================================= */

function extractArrayData(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('vi-VN').format(number) + ' ₫';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body !== null && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const text = await response.text();
    let data = {};

    if (text) {
      try { data = JSON.parse(text); }
      catch (e) { data = { message: text }; }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Lỗi máy chủ (${response.status})`);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${method} ${endpoint}:`, err);
    throw err;
  }
}

/* =========================================================
   CUSTOM MODAL
========================================================= */

function initCustomModal() {
  if (document.getElementById('app-custom-modal')) return;

  const modalHtml = `
    <div class="custom-modal-overlay" id="app-custom-modal">
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <h5 id="custom-modal-title"><i class="fa-solid fa-circle-info me-2"></i>Thông báo</h5>
          <button type="button" class="custom-modal-close" onclick="closeAppModal()">&times;</button>
        </div>
        <div class="custom-modal-body" id="custom-modal-body"></div>
        <div class="custom-modal-footer" id="custom-modal-footer">
          <button type="button" class="btn-modal-primary" onclick="closeAppModal()">Xác nhận</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function showAppModal(title, text, showPrintBtn = false) {
  initCustomModal();

  const titleEl = document.getElementById('custom-modal-title');
  const bodyEl = document.getElementById('custom-modal-body');
  const footerEl = document.getElementById('custom-modal-footer');
  const modalEl = document.getElementById('app-custom-modal');

  if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-circle-info me-2"></i>${title}`;
  if (bodyEl) bodyEl.innerHTML = text;

  if (footerEl) {
    if (showPrintBtn) {
      footerEl.innerHTML = `
        <button type="button" class="btn-modal-print no-print" onclick="window.print()">
          <i class="fa-solid fa-print me-1"></i>In phiếu vé
        </button>
        <button type="button" class="btn-modal-primary no-print" onclick="closeAppModal()">Đóng</button>
      `;
    } else {
      footerEl.innerHTML = `
        <button type="button" class="btn-modal-primary" onclick="closeAppModal()">Xác nhận</button>
      `;
    }
  }

  if (modalEl) modalEl.classList.add('active');
}

function closeAppModal() {
  const modal = document.getElementById('app-custom-modal');
  if (modal) modal.classList.remove('active');
}

/* =========================================================
   SEAT TOOLTIP
========================================================= */

function initTooltipElement() {
  if (document.getElementById('seat-hover-tooltip')) return;

  const tooltip = document.createElement('div');
  tooltip.id = 'seat-hover-tooltip';
  tooltip.className = 'seat-hover-tooltip';
  document.body.appendChild(tooltip);
}

function showSeatTooltip(evt, seatId, isOccupied, isSelected, isVip) {
  const tooltip = document.getElementById('seat-hover-tooltip');
  if (!tooltip) return;

  const seatType = isVip ? 'Ghế VIP' : 'Ghế Thường';
  let statusText = 'Ghế trống';
  let statusColor = '#38bdf8';

  if (isOccupied) {
    statusText = 'Đã bán / Đặt chỗ';
    statusColor = '#ef4444';
  } else if (isSelected) {
    statusText = 'Đang chọn';
    statusColor = '#f59e0b';
  }

  const roomName = state.selectedShowtime?.roomName || 'N/A';
  const movieTitle = state.selectedMovie?.title || 'Chưa chọn phim';
  const showtimeStr = (state.selectedShowtime?.time && state.selectedShowtime.time !== '--:--')
    ? `${state.selectedShowtime.time} (${state.selectedShowtime.date})`
    : 'N/A';

  let html = `
    <div style="font-weight:bold; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:6px; font-size:.9rem; color:#f8fafc;">
      <i class="fa-solid fa-couch me-1"></i>Ghế: ${escapeHtml(seatId)}
      <span style="font-size:.75rem; font-weight:normal; color:#cbd5e1;">(${seatType})</span>
    </div>
    <div><b>Trạng thái:</b> <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
    <div><b>Phòng chiếu:</b> ${escapeHtml(roomName)}</div>
  `;

  if (state.selectedMovie?.title) {
    html += `
      <div><b>Phim:</b> ${escapeHtml(movieTitle)}</div>
      <div><b>Suất chiếu:</b> ${escapeHtml(showtimeStr)}</div>
    `;
  }

  if (isOccupied) {
    const info = state.occupiedDetails[seatId] || {};
    html += `
      <div style="margin-top:6px; border-top:1px dashed #475569; padding-top:6px; color:#f1f5f9;">
        <div><b>Khách hàng:</b> ${escapeHtml(info.customerName || 'Đã mua vé')}</div>
        <div><b>SĐT:</b> ${escapeHtml(info.customerPhone || 'N/A')}</div>
        ${info.ticketCode ? `<div><b>Mã vé:</b> <span style="color:#a78bfa;">${escapeHtml(info.ticketCode)}</span></div>` : ''}
      </div>
    `;
  }

  tooltip.innerHTML = html;
  tooltip.classList.add('active');
  moveSeatTooltip(evt);
}

function moveSeatTooltip(evt) {
  const tooltip = document.getElementById('seat-hover-tooltip');
  if (!tooltip || !tooltip.classList.contains('active')) return;

  const tooltipWidth = tooltip.offsetWidth || 260;
  const tooltipHeight = tooltip.offsetHeight || 180;

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

/* =========================================================
   ROOM LAYOUT
========================================================= */

function parseRoomLayout(raw) {
  if (!raw) return { rows: 5, cols: 6, hasAisle: false, vipSeats: [], seatCodeMap: {} };

  let obj = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch (e) { obj = {}; }
  }

  let seatArray = [];
  if (Array.isArray(obj)) {
    seatArray = obj;
  } else if (obj && Array.isArray(obj.seatLayout)) {
    seatArray = obj.seatLayout;
  }

  let rows = 0;
  let cols = 0;
  const vipSeats = [];
  const seatCodeMap = {};

  if (!Array.isArray(obj) && obj) {
    rows = parseInt(obj.soHangGhe) || parseInt(obj.rows) || 0;
    cols = parseInt(obj.soCotGhe) || parseInt(obj.cols) || 0;
  }

  if (seatArray.length > 0) {
    let maxRowIdx = -1;
    let maxColNum = 0;

    seatArray.forEach(seat => {
      const code = seat.code;
      const type = String(seat.type || seat.seatType || '').trim().toUpperCase();
      let rowIndex = -1;
      let colNumber = -1;

      if (seat.row !== undefined) {
        const rowValue = String(seat.row).trim().toUpperCase();
        if (/^[A-Z]+$/.test(rowValue)) rowIndex = rowValue.charCodeAt(0) - 65;
        else if (!isNaN(parseInt(rowValue))) rowIndex = parseInt(rowValue) - 1;
      }

      if (seat.col !== undefined) colNumber = parseInt(seat.col);

      if (code && (rowIndex < 0 || isNaN(colNumber) || colNumber < 1)) {
        const cleanCode = String(code).trim().toUpperCase();
        const match = cleanCode.match(/^([A-Z]+)[-_]?(\d+)$/);
        if (match) {
          rowIndex = match[1].charCodeAt(0) - 65;
          colNumber = parseInt(match[2], 10);
        }
      }

      if (rowIndex >= 0 && colNumber > 0) {
        maxRowIdx = Math.max(maxRowIdx, rowIndex);
        maxColNum = Math.max(maxColNum, colNumber);
        seatCodeMap[`${rowIndex}_${colNumber}`] = code;
      }

      if (code && (type === 'VIP' || type.includes('VIP'))) {
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
    hasAisle = obj.coLoiDi === true || obj.hasAisle === true;
  }

  return { rows, cols, hasAisle, vipSeats, seatCodeMap };
}

/* =========================================================
   INITIAL DATA
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initCustomModal();
  initTooltipElement();
  initInitialData();
});

async function initInitialData() {
  await Promise.all([
    loadMoviesDropdown(),
    loadCombosDropdown(),
    loadRoomsDropdown()
  ]);
}

/* =========================================================
   MOVIES
========================================================= */

async function loadMoviesDropdown() {
  try {
    const response = await apiRequest('/movies');
    const movies = extractArrayData(response);
    const select = document.getElementById('movie-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn tên phim --</option>';
    movies.forEach(movie => {
      const option = document.createElement('option');
      option.value = movie.id;
      option.textContent = movie.title || movie.name || '';
      option.dataset.title = movie.title || movie.name || '';
      option.dataset.regular = movie.regularPrice ?? movie.price ?? 80000;
      option.dataset.vip = movie.vipPrice ?? 90000;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('[Lỗi Load Phim]:', err.message);
  }
}

/* =========================================================
   COMBOS
========================================================= */

async function loadCombosDropdown() {
  try {
    const response = await apiRequest('/combos');
    const combos = extractArrayData(response);
    const select = document.getElementById('combo-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Không chọn combo --</option>';
    combos.forEach(combo => {
      const price = Number(combo.totalPrice ?? combo.price ?? 0);
      const items = combo.items || combo.products || combo.comboItems || combo.comboProducts || combo.details || [];
      const option = document.createElement('option');

      option.value = combo.id;
      option.textContent = `${combo.name} (${formatCurrency(price)})`;
      option.dataset.price = price;
      option.dataset.items = JSON.stringify(items);
      option.dataset.comboName = combo.name || '';
      select.appendChild(option);
    });
  } catch (err) {
    console.error('[Lỗi Load Combo]:', err.message);
    showAppModal('Lỗi', 'Không thể tải danh sách combo: ' + escapeHtml(err.message));
  }
}

function normalizeComboItem(item) {
  if (!item) return null;

  const product = item.product || item.sanPham || item.productInfo || null;
  const rawId = item.productId ?? item.sanPhamId ?? item.id ?? product?.id;
  const id = rawId !== undefined && rawId !== null ? rawId : null;

  const name = item.productName ?? item.sanPhamName ?? item.name ?? item.tenSp ??
               item.tenSanPham ?? product?.name ?? product?.tenSp ?? product?.tensp ?? '';

  let rawType = item.type ?? item.productType ?? item.loai ?? item.categoryType ??
                item.category?.name ?? item.category?.code ?? product?.type ??
                product?.productType ?? product?.category ?? '';

  let type = String(rawType).trim().toUpperCase();

  if (rawType && typeof rawType === 'object') {
    type = String(rawType.code ?? rawType.name ?? rawType.type ?? '').trim().toUpperCase();
  }

  if (type.includes('NƯỚC') || type.includes('NUOC') || type.includes('DRINK') || type.includes('BEVERAGE') || type.includes('WATER')) {
    type = 'DRINK';
  } else if (type.includes('BẮP') || type.includes('BAP') || type.includes('POPCORN') || type.includes('FOOD') || type.includes('SNACK')) {
    type = 'POPCORN';
  }

  return {
    id: id,
    name: String(name || '').trim(),
    type,
    quantity: Number(item.quantity ?? item.soLuong ?? 1)
  };
}

function getComboItems(combo) {
  if (!combo) return [];
  const rawItems = combo.items || combo.products || combo.comboItems || combo.comboProducts || combo.details || [];
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map(normalizeComboItem).filter(item => item && item.id !== null);
}

async function loadComboDetails(comboId) {
  if (!comboId) return null;
  try {
    const response = await apiRequest(`/combos/${comboId}`);
    const detail = response?.data && !Array.isArray(response.data) ? response.data : response;
    if (!detail || typeof detail !== 'object') return null;
    return detail;
  } catch (err) {
    console.warn('[Không lấy được chi tiết combo]:', err.message);
    return null;
  }
}

function renderComboProducts(combo) {
  const drinkContainer = document.getElementById('drink-list');
  const popcornContainer = document.getElementById('popcorn-list');

  if (!drinkContainer || !popcornContainer) return;

  const items = getComboItems(combo);
  const drinks = items.filter(item => item.type === 'DRINK');
  const popcorns = items.filter(item => item.type === 'POPCORN');

  /* ---------- BẮP ---------- */
  if (popcorns.length > 0) {
    const popcorn = popcorns[0];
    popcornContainer.innerHTML = `
      <div class="form-check">
        <input class="form-check-input popcorn-checkbox" type="checkbox" name="popcorn"
          value="${popcorn.id}" data-product-id="${popcorn.id}" data-name="${escapeHtml(popcorn.name)}"
          id="popcorn-${popcorn.id}" checked disabled>
        <label class="form-check-label" for="popcorn-${popcorn.id}">${escapeHtml(popcorn.name)}</label>
      </div>
    `;
  } else {
    popcornContainer.innerHTML = `<small class="text-danger">Combo này không có bắp.</small>`;
  }

  /* ---------- NƯỚC ---------- */
  if (drinks.length > 0) {
    drinkContainer.innerHTML = drinks.map(drink => `
      <div class="form-check">
        <input class="form-check-input drink-checkbox" type="radio" name="drink"
          value="${drink.id}" data-product-id="${drink.id}" data-name="${escapeHtml(drink.name)}"
          id="drink-${drink.id}">
        <label class="form-check-label" for="drink-${drink.id}">${escapeHtml(drink.name)}</label>
      </div>
    `).join('');
  } else {
    drinkContainer.innerHTML = `<small class="text-danger">Combo này không có nước.</small>`;
  }
}

/* =========================================================
   PROMOTION
========================================================= */

function invalidatePromo(message = 'Đơn hàng đã thay đổi. Vui lòng áp dụng lại mã giảm giá.') {
  if (!state.appliedPromo) return;
  state.appliedPromo = null;

  const input = document.getElementById('promo-code-input') || document.getElementById('promoCodeInput');
  if (input) input.value = '';

  const messageEl = document.getElementById('promo-code-message');
  if (messageEl) {
    messageEl.className = 'text-warning small mt-1';
    messageEl.textContent = message;
  }
  updateTotal();
}

function removePromoCode() {
  state.appliedPromo = null;
  const input = document.getElementById('promo-code-input') || document.getElementById('promoCodeInput');
  if (input) input.value = '';

  const messageEl = document.getElementById('promo-code-message');
  if (messageEl) {
    messageEl.className = 'text-muted small mt-1';
    messageEl.textContent = '';
  }
  updateTotal();
}

async function applyPromoCode() {
  const input = document.getElementById('promo-code-input') || document.getElementById('promoCodeInput');
  const code = input ? input.value.trim().toUpperCase() : '';
  const messageEl = document.getElementById('promo-code-message');

  if (!code) {
    const errorMsg = 'Vui lòng nhập mã giảm giá!';
    if (typeof Swal !== 'undefined') {
      Swal.fire({ icon: 'warning', title: 'Cảnh báo', text: errorMsg });
    } else {
      showAppModal('Cảnh báo', errorMsg);
    }
    if (messageEl) {
      messageEl.className = 'text-danger small mt-1';
      messageEl.textContent = errorMsg;
    }
    return;
  }

  const subtotal = getSubtotalBeforePromo();
  if (subtotal <= 0) {
    const errorMsg = 'Vui lòng chọn ghế trước khi áp mã giảm giá!';
    if (typeof Swal !== 'undefined') {
      Swal.fire({ icon: 'warning', title: 'Cảnh báo', text: errorMsg });
    } else {
      showAppModal('Cảnh báo', errorMsg);
    }
    if (messageEl) {
      messageEl.className = 'text-danger small mt-1';
      messageEl.textContent = errorMsg;
    }
    return;
  }

  try {
    const response = await fetch(`/promo-codes/api/check?code=${encodeURIComponent(code)}&orderTotal=${subtotal}`);
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.success) {
      const promoData = result.data || {};
      state.appliedPromo = {
        code: promoData.code || code,
        name: promoData.name || code,
        discountAmount: Number(promoData.discountAmount || 0)
      };

      const successText = `Đã áp dụng "${state.appliedPromo.name}" — giảm ${formatCurrency(state.appliedPromo.discountAmount)}`;

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: successText,
          timer: 2000
        });
      }

      if (messageEl) {
        messageEl.className = 'text-success small mt-1';
        messageEl.textContent = successText;
      }
      updateTotal();
    } else {
      state.appliedPromo = null;
      const failMsg = result.message || 'Mã giảm giá đã hết lượt sử dụng!';

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Không thể áp dụng',
          text: failMsg,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Đóng'
        });
      } else {
        showAppModal('Không thể áp dụng mã', failMsg);
      }

      if (messageEl) {
        messageEl.className = 'text-danger small mt-1';
        messageEl.textContent = failMsg;
      }
      updateTotal();
    }
  } catch (err) {
    console.error('[Lỗi áp mã giảm giá]:', err);
    state.appliedPromo = null;
    const errorText = 'Không thể kết nối đến máy chủ!';

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi hệ thống',
        text: errorText
      });
    } else {
      showAppModal('Lỗi hệ thống', errorText);
    }

    if (messageEl) {
      messageEl.className = 'text-danger small mt-1';
      messageEl.textContent = errorText;
    }
    updateTotal();
  }
}

/* =========================================================
   ROOM
========================================================= */

async function loadRoomsDropdown() {
  const select = document.getElementById('room-filter');
  if (!select) return;

  try {
    const response = await apiRequest('/rooms');
    const rooms = extractArrayData(response);

    select.innerHTML = '<option value="">-- Chọn phòng chiếu --</option>';
    rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = room.tenPhong || room.name || `Phòng ${room.id}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('[Lỗi Load Phòng]:', err.message);
  }
}

async function onRoomFilterChange(roomId) {
  const placeholder = document.getElementById('map-placeholder');
  const mapArea = document.getElementById('seat-map-area');

  if (!roomId) {
    if (placeholder) placeholder.style.display = 'block';
    if (mapArea) mapArea.style.display = 'none';
    return;
  }

  try {
    let roomData = null;
    try {
      roomData = await apiRequest(`/rooms/${roomId}`);
    } catch (e) {
      const response = await apiRequest('/rooms');
      const rooms = extractArrayData(response);
      roomData = rooms.find(room => String(room.id) === String(roomId));
    }

    if (!roomData) {
      showAppModal('Thông báo', 'Không tìm thấy thông tin phòng chiếu.');
      return;
    }

    const roomName = roomData.tenPhong || roomData.name || `Phòng ${roomId}`;
    state.selectedShowtime = {
      id: null,
      time: '--:--',
      date: 'Xem trực tiếp phòng',
      roomName,
      roomId
    };

    state.seatLayout = roomData;
    state.occupiedSeats = roomData.soldSeats || [];
    state.occupiedDetails = {};

    if (Array.isArray(roomData.seatDetails)) {
      roomData.seatDetails.forEach(detail => {
        const key = String(detail.seatCode).trim().toUpperCase();
        state.occupiedDetails[key] = {
          customerName: detail.customerName,
          customerPhone: detail.customerPhone,
          ticketCode: detail.ticketCode,
          seatType: detail.seatType,
          ticketPrice: detail.ticketPrice,
          bookingCode: detail.bookingCode,
          paymentMethod: detail.paymentMethod || 'COUNTER',
          isVerified: detail.isVerified || false
        };
      });
    }

    renderSeatMap(false);
  } catch (err) {
    showAppModal('Lỗi', 'Không thể tải sơ đồ phòng chiếu: ' + escapeHtml(err.message));
  }
}

/* =========================================================
   MOVIE CHANGE
========================================================= */

async function onMovieChange() {
  state.highlightSeat = null;
  const select = document.getElementById('movie-select');
  const movieId = select ? select.value : '';
  const option = select ? select.options[select.selectedIndex] : null;

  if (!movieId) {
    state.selectedMovie = null;
    state.selectedShowtime = null;
    state.selectedSeats = [];

    const showtimeSection = document.getElementById('showtime-section');
    const checkoutSection = document.getElementById('checkout-section');
    if (showtimeSection) showtimeSection.style.display = 'none';
    if (checkoutSection) checkoutSection.style.display = 'none';
    return;
  }

  state.selectedMovie = {
    id: movieId,
    title: option?.dataset.title || '',
    regularPrice: Number(option?.dataset.regular || 80000),
    vipPrice: Number(option?.dataset.vip || 90000)
  };

  state.selectedSeats = [];
  state.selectedCombo = null;
  state.appliedPromo = null;

  const comboSelect = document.getElementById('combo-select');
  if (comboSelect) comboSelect.value = '';

  const comboPanel = document.getElementById('combo-options');
  if (comboPanel) comboPanel.style.display = 'none';

  const promoInput = document.getElementById('promo-code-input') || document.getElementById('promoCodeInput');
  if (promoInput) promoInput.value = '';

  const promoMessage = document.getElementById('promo-code-message');
  if (promoMessage) {
    promoMessage.className = 'text-muted small mt-1';
    promoMessage.textContent = '';
  }

  try {
    const response = await apiRequest(`/counter/showtimes?movieId=${encodeURIComponent(movieId)}`);
    const showtimes = extractArrayData(response);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const validShowtimes = showtimes.filter(showtime => {
      if (!showtime.showDate) return false;
      const date = showtime.showDate.includes('T') ? showtime.showDate.split('T')[0] : showtime.showDate;
      if (date > today) return true;
      if (date === today) {
        const time = showtime.startTime ? showtime.startTime.slice(0, 5) : '00:00';
        return time >= currentTime;
      }
      return false;
    });

    const container = document.getElementById('showtime-list');
    if (!container) return;

    if (validShowtimes.length === 0) {
      container.innerHTML = `
        <div class="alert alert-warning text-center p-2 my-2" style="font-size:.85rem;">
          <i class="fa-solid fa-triangle-exclamation me-1"></i> Không có suất chiếu nào sắp tới.
        </div>
      `;
    } else {
      container.innerHTML = validShowtimes.map(showtime => {
        const roomName = escapeHtml(showtime.roomName || 'Phòng chiếu');
        return `
          <div class="showtime-item" data-id="${showtime.id}"
            onclick="selectShowtime(
              '${showtime.id}',
              '${showtime.startTime}',
              '${showtime.showDate}',
              '${String(showtime.roomName || '').replace(/'/g, "\\'")}',
              '${showtime.roomId || ''}'
            )">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="time fw-bold">${escapeHtml(showtime.startTime || '')}</span>
                <span class="text-muted ms-2" style="font-size:.85rem;">${escapeHtml(showtime.showDate || '')}</span>
              </div>
              <span class="badge-room">${roomName}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    const section = document.getElementById('showtime-section');
    if (section) section.style.display = 'block';
    updateTotal();
  } catch (err) {
    showAppModal('Lỗi', 'Không thể lấy dữ liệu suất chiếu: ' + escapeHtml(err.message));
  }
}

/* =========================================================
   SHOWTIME
========================================================= */

async function selectShowtime(showtimeId, time, date, roomName, roomId) {
  state.highlightSeat = null;

  try {
    state.selectedShowtime = { id: showtimeId, time, date, roomName, roomId };
    state.selectedSeats = [];
    state.appliedPromo = null;

    const promoInput = document.getElementById('promo-code-input') || document.getElementById('promoCodeInput');
    if (promoInput) promoInput.value = '';

    const promoMessage = document.getElementById('promo-code-message');
    if (promoMessage) {
      promoMessage.className = 'text-muted small mt-1';
      promoMessage.textContent = '';
    }

    const roomSelect = document.getElementById('room-filter');
    if (roomSelect && roomId) roomSelect.value = roomId;

    document.querySelectorAll('.showtime-item').forEach(item => {
      item.classList.toggle('selected', String(item.dataset.id) === String(showtimeId));
    });

    const response = await apiRequest(`/counter/seat-map/${showtimeId}`);
    state.seatLayout = response;
    state.occupiedSeats = [
      ...(response.soldSeats || []),
      ...(response.holdingSeats || [])
    ];
    state.occupiedDetails = {};

    if (Array.isArray(response.seatDetails)) {
      response.seatDetails.forEach(detail => {
        const key = String(detail.seatCode).trim().toUpperCase();
        state.occupiedDetails[key] = {
          customerName: detail.customerName,
          customerPhone: detail.customerPhone,
          ticketCode: detail.ticketCode,
          seatType: detail.seatType,
          ticketPrice: detail.ticketPrice,
          bookingCode: detail.bookingCode,
          comboName: detail.comboName,
          comboPrice: detail.comboPrice,
          totalAmount: detail.totalAmount,
          paymentMethod: detail.paymentMethod || 'COUNTER',
          isVerified: detail.isVerified || false
        };
      });
    }

    if (response.regularPrice != null) state.selectedMovie.regularPrice = Number(response.regularPrice);
    if (response.vipPrice != null) state.selectedMovie.vipPrice = Number(response.vipPrice);

    renderSeatMap(true);
    const checkout = document.getElementById('checkout-section');
    if (checkout) checkout.style.display = 'block';

    updateTotal();
  } catch (err) {
    showAppModal('Lỗi Server', escapeHtml(err.message));
  }
}

/* =========================================================
   SEAT MAP
========================================================= */

function renderSeatMap(canSelect = true) {
  if (!state.selectedShowtime || !state.seatLayout) return;

  const { rows, cols, hasAisle, vipSeats, seatCodeMap } = parseRoomLayout(state.seatLayout);
  const vipSet = new Set(vipSeats.map(seat => String(seat).trim().toUpperCase()));

  let finalCols = cols;
  let aisleIndex = -1;

  if (hasAisle && cols > 1) {
    finalCols = cols + 1;
    aisleIndex = Math.floor(cols / 2);
  }

  const container = document.getElementById('seat-map-container');
  const placeholder = document.getElementById('map-placeholder');
  const mapArea = document.getElementById('seat-map-area');

  if (placeholder) placeholder.style.display = 'none';
  if (mapArea) mapArea.style.display = 'block';

  const roomNameEl = document.getElementById('map-room-name');
  if (roomNameEl) roomNameEl.textContent = state.selectedShowtime.roomName || 'Phòng chiếu';

  const showInfoEl = document.getElementById('map-show-info');
  if (showInfoEl) {
    showInfoEl.textContent = state.selectedMovie?.title
      ? `${state.selectedMovie.title} — ${state.selectedShowtime.time} ${state.selectedShowtime.date}`
      : state.selectedShowtime.roomName;
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let html = `
    <div class="screen-area"><div class="screen-shape"><span>MÀN HÌNH</span></div></div>
    <div class="seat-grid-matrix" style="display:grid; grid-template-columns:repeat(${finalCols}, auto); gap:10px 8px; justify-content:center; align-items:center; width:fit-content; margin:20px auto; max-width:100%; overflow-x:auto;">
  `;

  for (let row = 0; row < rows; row++) {
    const rowLabel = alphabet[row] || `R${row + 1}`;
    let seatNumber = 1;

    for (let col = 0; col < finalCols; col++) {
      if (hasAisle && col === aisleIndex) {
        html += `<div class="seat-preview-box aisle"></div>`;
        continue;
      }

      const colLabel = seatNumber < 10 ? `0${seatNumber}` : String(seatNumber);
      const defaultSeatId = `${rowLabel}${colLabel}`;
      const mappedCode = seatCodeMap[`${row}_${seatNumber}`];
      const seatId = mappedCode ? String(mappedCode).toUpperCase() : defaultSeatId;
      const normalized = seatId.trim().toUpperCase();

      const isOccupied = state.occupiedSeats.some(seat => String(seat).trim().toUpperCase() === normalized);
      const isSelected = state.selectedSeats.some(seat => String(seat).trim().toUpperCase() === normalized);
      const isVip = vipSet.has(normalized);
      const isHighlighted = state.highlightSeat === normalized;
      const detail = state.occupiedDetails[normalized] || {};
      const isAppPending = isOccupied && String(detail.paymentMethod || '').toUpperCase() === 'APP';

      let className = 'seat-preview-box seat';
      let content = escapeHtml(seatId);

      if (isHighlighted) {
        className += ' highlight-checked';
        content = `${escapeHtml(seatId)} <i class="fa-solid fa-user-check ms-1"></i>`;
      } else if (isAppPending) {
        className += ' app-booked';
        content = `${escapeHtml(seatId)} <i class="fa-solid fa-mobile-screen-button ms-1"></i>`;
      } else if (isOccupied) {
        className += ' sold';
        content = `${escapeHtml(seatId)} <i class="fa-solid fa-check ms-1"></i>`;
      } else if (isSelected) {
        className += ' selected';
        content = '<i class="fa-solid fa-check"></i>';
      } else if (isVip) {
        className += ' vip';
      }

      html += `
        <div class="${className}" data-seat="${escapeHtml(seatId)}"
          onclick="handleSeatClick('${escapeHtml(seatId)}', ${isOccupied}, ${canSelect})"
          onmouseenter="showSeatTooltip(event, '${escapeHtml(seatId)}', ${isOccupied}, ${isSelected}, ${isVip})"
          onmousemove="moveSeatTooltip(event)" onmouseleave="hideSeatTooltip()">
          ${content}
        </div>
      `;
      seatNumber++;
    }
  }

  html += `
    </div>
    <div class="seat-legend d-flex justify-content-center gap-3 mt-3 flex-wrap">
      <div class="legend-item"><span class="legend-box normal"></span> Ghế thường</div>
      <div class="legend-item"><span class="legend-box vip" style="background-color:#f59e0b;"></span> Ghế VIP</div>
      <div class="legend-item"><span class="legend-box sold" style="background-color:#22c55e;"></span> Đã thanh toán</div>
      <div class="legend-item"><span class="legend-box app-booked" style="background-color:#2563eb;"></span> Đặt qua App</div>
    </div>
  `;

  if (container) container.innerHTML = html;
  updateSeatLabels();
}

function handleSeatClick(seatId, isOccupied, canSelect) {
  if (isOccupied) {
    showOccupiedSeatInfo(seatId);
    return;
  }
  if (!canSelect) {
    showAppModal('Thông báo', 'Vui lòng chọn suất chiếu trước khi chọn ghế!');
    return;
  }
  toggleSeat(seatId);
}

function toggleSeat(seatId) {
  if (!state.selectedShowtime || state.occupiedSeats.some(seat => String(seat).trim().toUpperCase() === String(seatId).trim().toUpperCase())) {
    return;
  }

  const normalized = String(seatId).trim().toUpperCase();
  const index = state.selectedSeats.findIndex(seat => String(seat).trim().toUpperCase() === normalized);

  if (index >= 0) state.selectedSeats.splice(index, 1);
  else state.selectedSeats.push(seatId);

  if (state.appliedPromo) invalidatePromo();
  else updateTotal();

  renderSeatMap(true);
  updateTotal();
}

function updateSeatLabels() {
  const label = document.getElementById('selected-seats-label');
  const button = document.getElementById('btn-create');

  if (label) {
    const seatCount = state.selectedSeats.length;
    if (seatCount === 0) {
      label.textContent = '—';
    } else if (seatCount === 1) {
      label.textContent = [...state.selectedSeats].sort().join(', ');
    } else {
      label.textContent = `(${seatCount} ghế) ${[...state.selectedSeats].sort().join(', ')}`;
    }
  }

  if (button) button.disabled = state.selectedSeats.length === 0;
}

/* =========================================================
   PRICE
========================================================= */

function calculateSeatTotal() {
  if (!state.selectedMovie || state.selectedSeats.length === 0) return 0;

  const regularPrice = Number(state.selectedMovie.regularPrice || 80000);
  const vipPrice = Number(state.selectedMovie.vipPrice || 90000);
  const { vipSeats } = parseRoomLayout(state.seatLayout);
  const vipSet = new Set(vipSeats.map(seat => String(seat).trim().toUpperCase()));

  let total = 0;
  state.selectedSeats.forEach(seat => {
    const normalized = String(seat).trim().toUpperCase();
    total += vipSet.has(normalized) ? vipPrice : regularPrice;
  });
  return total;
}

function calculateComboTotal() {
  if (!state.selectedCombo) return 0;
  return Number(state.selectedCombo.price || 0);
}

function calculateSubtotal() {
  return calculateSeatTotal() + calculateComboTotal();
}

function getSubtotalBeforePromo() {
  return calculateSubtotal();
}

function updateTotal() {
  const seatTotal = calculateSeatTotal();
  const comboTotal = calculateComboTotal();
  const discount = state.appliedPromo ? Number(state.appliedPromo.discountAmount || 0) : 0;
  const subtotal = seatTotal + comboTotal;
  const finalTotal = Math.max(0, subtotal - discount);

  const totalEl = document.getElementById('total-price');
  if (totalEl) totalEl.textContent = formatCurrency(finalTotal);

  const seatPriceEl = document.getElementById('seat-price');
  if (seatPriceEl) seatPriceEl.textContent = formatCurrency(seatTotal);

  const comboPriceEl = document.getElementById('combo-price');
  if (comboPriceEl) comboPriceEl.textContent = formatCurrency(comboTotal);

  const discountEl = document.getElementById('discount-price');
  if (discountEl) discountEl.textContent = '-' + formatCurrency(discount);

  updateSeatLabels();
  return finalTotal;
}

/* =========================================================
   COMBO CHANGE
========================================================= */

async function onComboChange() {
  const comboSelect = document.getElementById('combo-select');
  const comboId = comboSelect ? comboSelect.value : '';
  const panel = document.getElementById('combo-options');

  if (!comboId) {
    state.selectedCombo = null;
    if (panel) panel.style.display = 'none';
    document.querySelectorAll('.drink-checkbox, .popcorn-checkbox').forEach(cb => cb.checked = false);

    if (state.appliedPromo) invalidatePromo();
    else updateTotal();
    return;
  }

  const option = comboSelect.options[comboSelect.selectedIndex];
  let items = [];

  try {
    items = JSON.parse(option.dataset.items || '[]');
  } catch (e) {
    console.warn('[Combo items không hợp lệ]');
  }

  let normalizedItems = Array.isArray(items)
    ? items.map(normalizeComboItem).filter(item => item && item.id !== null)
    : [];

  if (normalizedItems.length === 0) {
    const detail = await loadComboDetails(comboId);
    if (detail) {
      const detailItems = detail.items || detail.products || detail.comboItems || detail.comboProducts || detail.details || [];
      if (Array.isArray(detailItems)) {
        normalizedItems = detailItems.map(normalizeComboItem).filter(item => item && item.id !== null);
      }
    }
  }

  state.selectedCombo = {
    id: comboId,
    name: option.dataset.comboName || option.textContent.replace(/\s*\(.*\)$/, ''),
    price: Number(option.dataset.price || 0),
    items: normalizedItems
  };

  if (panel) panel.style.display = 'block';
  renderComboProducts(state.selectedCombo);

  if (state.appliedPromo) invalidatePromo();
  else updateTotal();
}

function loadComboOptionsData() {
  if (state.selectedCombo) {
    renderComboProducts(state.selectedCombo);
  } else {
    const drinkContainer = document.getElementById('drink-list');
    const popcornContainer = document.getElementById('popcorn-list');
    if (drinkContainer) drinkContainer.innerHTML = '';
    if (popcornContainer) popcornContainer.innerHTML = '';
  }
}

function renderComboItemsUI() {
  if (state.selectedCombo) {
    renderComboProducts(state.selectedCombo);
    return;
  }
  const drinkContainer = document.getElementById('drink-list');
  const popcornContainer = document.getElementById('popcorn-list');
  if (drinkContainer) drinkContainer.innerHTML = '';
  if (popcornContainer) popcornContainer.innerHTML = '';
}

function validateComboSelection(currentCheckbox, type) {
  if (!currentCheckbox || type !== 'drink') return;
  document.querySelectorAll('input[name="drink"]').forEach(checkbox => {
    if (checkbox !== currentCheckbox) checkbox.checked = false;
  });
}

/* =========================================================
   OCCUPIED SEAT INFO
========================================================= */

function showOccupiedSeatInfo(seatId) {
  const info = state.occupiedDetails[String(seatId).trim().toUpperCase()] || {};
  const isVip = String(info.seatType || '').toUpperCase() === 'VIP';
  const seatPrice = Number(info.ticketPrice || 0);
  const comboPrice = Number(info.comboPrice || 0);
  const discountPrice = Number(info.discountAmount || 0);
  const totalAmount = info.totalAmount != null ? Number(info.totalAmount) : Math.max(0, seatPrice + comboPrice - discountPrice);
  const hasCombo = info.comboName && info.comboName !== 'Không';

  const comboHtml = hasCombo ? `
    <div style="grid-column:span 2; background:#f1f5f9; padding:8px; border-radius:6px;">
      <span style="color:#475569; font-size:.8rem; font-weight:bold;">Combo: ${escapeHtml(info.comboName)}</span>
      <div style="font-size:.85rem; color:#334155;">Giá combo: <b>${formatCurrency(comboPrice)}</b></div>
    </div>
  ` : '';

  const promoHtml = discountPrice > 0 ? `
    <div style="grid-column:span 2; background:#ecfdf5; padding:8px; border-radius:6px;">
      <span style="color:#047857; font-size:.8rem; font-weight:bold;">Khuyến mãi</span>
      <div style="font-size:.85rem; color:#065f46;">Giảm giá: <b>-${formatCurrency(discountPrice)}</b></div>
    </div>
  ` : '';

  const html = `
    <div id="printable-ticket-area" style="text-align:left; background:#fff; padding:10px; border-radius:8px;">
      <div style="text-align:center; margin-bottom:15px;">
        <div style="font-size:2rem; color:#22c55e;"><i class="fa-solid fa-circle-check"></i></div>
        <h4 style="margin:5px 0; color:#22c55e; font-weight:bold;">Vé đã thanh toán</h4>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:.9rem; border-top:1px dashed #ccc; padding-top:10px;">
        <div>
          <span class="text-muted small">Mã vé</span>
          <div style="font-weight:bold; color:#2563eb;">${escapeHtml(info.ticketCode || 'N/A')}</div>
        </div>
        <div>
          <span class="text-muted small">Mã đơn</span>
          <div style="font-weight:bold; color:#2563eb;">${escapeHtml(info.bookingCode || 'N/A')}</div>
        </div>
        <div>
          <span class="text-muted small">Khách hàng</span>
          <div class="fw-semibold">${escapeHtml(info.customerName || 'Đã mua vé')} (${escapeHtml(info.customerPhone || 'N/A')})</div>
        </div>
        <div>
          <span class="text-muted small">Ghế</span>
          <div class="fw-semibold">${escapeHtml(seatId)} ${isVip ? '<span style="color:#f59e0b;">(VIP)</span>' : '<span style="color:#64748b;">(Thường)</span>'}</div>
        </div>
        <div>
          <span class="text-muted small">Phòng chiếu</span>
          <div class="fw-semibold">${escapeHtml(state.selectedShowtime?.roomName || 'N/A')}</div>
        </div>
        <div>
          <span class="text-muted small">Phim</span>
          <div class="fw-semibold">${escapeHtml(state.selectedMovie?.title || 'N/A')}</div>
        </div>
        <div style="grid-column:span 2;">
          <span class="text-muted small">Suất chiếu</span>
          <div class="fw-semibold">${escapeHtml(state.selectedShowtime?.time || '')} ${escapeHtml(state.selectedShowtime?.date || '')}</div>
        </div>
        <div>
          <span class="text-muted small">Giá ghế</span>
          <div class="fw-semibold">${formatCurrency(seatPrice)}</div>
        </div>
        <div>
          <span class="text-muted small">Giá Combo</span>
          <div class="fw-semibold">${formatCurrency(comboPrice)}</div>
        </div>
        ${comboHtml}
        ${promoHtml}
        <div style="grid-column:span 2; border-top:1px solid #e2e8f0; padding-top:8px;">
          <span class="text-muted small">Tổng thanh toán</span>
          <div style="font-weight:bold; color:#22c55e; font-size:1.2rem;">${formatCurrency(totalAmount)}</div>
        </div>
      </div>
    </div>
  `;

  showAppModal('Thông Tin Đặt Vé', html, true);
}

/* =========================================================
   CREATE BOOKING
========================================================= */

async function createTicket(e) {
  if (e) e.preventDefault();

  if (!state.selectedShowtime || !state.selectedShowtime.id) {
    showAppModal('Cảnh báo', 'Vui lòng chọn suất chiếu!');
    return;
  }

  if (state.selectedSeats.length === 0) {
    showAppModal('Cảnh báo', 'Vui lòng chọn ít nhất một ghế!');
    return;
  }

  const nameInput = document.getElementById('customer-name');
  const phoneInput = document.getElementById('customer-phone');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name) {
    showAppModal('Cảnh báo', 'Vui lòng nhập tên khách hàng!');
    return;
  }

  const selectedDrinkEl = document.querySelector('input[name="drink"]:checked');
  const selectedPopcornEl = document.querySelector('input[name="popcorn"]:checked');

  const selectedDrink = selectedDrinkEl ? String(selectedDrinkEl.dataset.productId || selectedDrinkEl.value) : null;
  const selectedPopcorn = selectedPopcornEl ? String(selectedPopcornEl.dataset.productId || selectedPopcornEl.value) : null;

  if (state.selectedCombo) {
    const comboItems = getComboItems(state.selectedCombo);
    const drinks = comboItems.filter(item => item.type === 'DRINK');
    const popcorns = comboItems.filter(item => item.type === 'POPCORN');

    if (drinks.length > 0 && !selectedDrink) {
      showAppModal('Thiếu thông tin', 'Vui lòng chọn 1 loại nước cho combo.');
      return;
    }

    if (popcorns.length > 0 && !selectedPopcorn) {
      showAppModal('Thiếu thông tin', 'Không xác định được sản phẩm bắp của combo.');
      return;
    }
  }

  const button = document.getElementById('btn-create');
  if (button) {
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang xử lý...`;
  }

  const bookingPayload = {
    customerName: name,
    customerPhone: phone || null,
    showtimeId: String(state.selectedShowtime.id),
    selectedSeats: [...state.selectedSeats],
    comboId: state.selectedCombo ? String(state.selectedCombo.id) : null,
    selectedDrink: selectedDrink,
    selectedPopcorn: selectedPopcorn,
    promoCode: state.appliedPromo ? state.appliedPromo.code : null
  };

  try {
    console.log('[Counter Booking Request]', bookingPayload);
    const response = await apiRequest('/counter/booking', 'POST', bookingPayload);
    console.log('[Counter Booking Response]', response);

    const result = response?.data && !Array.isArray(response.data) ? response.data : response;
    const tickets = Array.isArray(result?.tickets) ? result.tickets : [];
    const bookingCode = result.bookingCode || result.code || result.bookingId || result.id || tickets[0]?.bookingCode || 'N/A';

    const finalAmount = Number(result.totalAmount ?? result.finalAmount ?? result.grandTotal ?? 0);
    const discountAmount = Number(result.discountAmount ?? state.appliedPromo?.discountAmount ?? 0);

    const comboName = result.comboName || result.combo?.name || state.selectedCombo?.name || '';
    const comboPrice = Number(result.comboPrice ?? result.combo?.price ?? state.selectedCombo?.price ?? 0);

    const { vipSeats } = parseRoomLayout(state.seatLayout);
    const vipSet = new Set(vipSeats.map(seat => String(seat).trim().toUpperCase()));
    const seatsCreated = [...state.selectedSeats].sort();

    let seatPriceTotal = 0;

    seatsCreated.forEach(seat => {
      const normalized = String(seat).trim().toUpperCase();
      const ticket = tickets.find(item => String(item.seatCode || item.seatNumber || item.seat || '').trim().toUpperCase() === normalized) || {};
      const isVip = vipSet.has(normalized);

      const ticketPrice = Number(ticket.price ?? ticket.ticketPrice ?? (isVip ? state.selectedMovie?.vipPrice : state.selectedMovie?.regularPrice) ?? 0);
      seatPriceTotal += ticketPrice;

      const ticketCode = ticket.ticketCode || ticket.code || ticket.ticketId || ticket.id || bookingCode;

      state.occupiedDetails[normalized] = {
        ticketCode,
        bookingCode,
        customerName: name,
        customerPhone: phone || 'N/A',
        seatType: ticket.seatType || (isVip ? 'VIP' : 'NORMAL'),
        ticketPrice,
        comboName: comboName || 'Không',
        comboPrice,
        totalAmount: finalAmount,
        discountAmount,
        paymentMethod: 'COUNTER',
        isVerified: false
      };

      if (!state.occupiedSeats.some(existing => String(existing).trim().toUpperCase() === normalized)) {
        state.occupiedSeats.push(normalized);
      }
    });

    let ticketDetailsList = '';
    if (tickets.length > 0) {
      ticketDetailsList = tickets.map(ticket => {
        const seat = ticket.seatCode || ticket.seatNumber || '';
        const code = ticket.ticketCode || ticket.code || ticket.ticketId || ticket.id || '';
        return `<b>${escapeHtml(seat)}</b>: <span style="color:#7c3aed;">${escapeHtml(code)}</span>`;
      }).join('<br>');
    } else {
      ticketDetailsList = seatsCreated.map(seat => `<b>${escapeHtml(seat)}</b>`).join(', ');
    }

    const popcornName = selectedPopcornEl?.dataset.name || result.selectedPopcornName || result.popcornName || '';
    const drinkName = selectedDrinkEl?.dataset.name || result.selectedDrinkName || result.drinkName || '';

    const comboHtml = state.selectedCombo ? `
      <div style="grid-column:span 2; background:#f1f5f9; padding:8px; border-radius:6px;">
        <span style="color:#475569; font-size:.8rem; font-weight:bold;">Combo: ${escapeHtml(comboName)}</span>
        <div style="font-size:.85rem; color:#334155;">
          ${popcornName ? `• Bắp: ${escapeHtml(popcornName)}<br>` : ''}
          ${drinkName ? `• Nước: ${escapeHtml(drinkName)}<br>` : ''}
          <b>Giá Combo: ${formatCurrency(comboPrice)}</b>
        </div>
      </div>
    ` : `
      <div>
        <span class="text-muted small">Giá Combo</span>
        <div class="fw-semibold">0 ₫</div>
      </div>
    `;

    const promoCode = result.promoCode || state.appliedPromo?.code || '';
    const promoHtml = discountAmount > 0 ? `
      <div style="grid-column:span 2; background:#ecfdf5; padding:8px; border-radius:6px;">
        <span style="color:#047857; font-size:.8rem; font-weight:bold;">Khuyến mãi (${escapeHtml(promoCode || 'Áp dụng mã')})</span>
        <div style="font-size:.85rem; color:#065f46;">Mức giảm: <b>-${formatCurrency(discountAmount)}</b></div>
      </div>
    ` : `
      <div>
        <span class="text-muted small">Khuyến mãi</span>
        <div class="fw-semibold">-0 ₫</div>
      </div>
    `;

    const movieName = result.movieName || result.movieTitle || state.selectedMovie?.title || '';
    const showtimeInfo = result.showtimeInfo || `${state.selectedShowtime?.time || ''} ${state.selectedShowtime?.date || ''}`;
    const roomName = result.roomName || state.selectedShowtime?.roomName || 'N/A';

    const seatCount = seatsCreated.length;
    const seatLabelDisplay = seatCount >= 2
      ? `<span class="badge bg-primary me-1">${seatCount} ghế</span> ${seatsCreated.map(escapeHtml).join(', ')}`
      : seatsCreated.map(escapeHtml).join(', ');

    const printHtml = `
      <div id="printable-ticket-area" style="text-align:left; background:#fff; padding:10px; border-radius:8px;">
        <div style="text-align:center; margin-bottom:15px;">
          <div style="font-size:2rem; color:#059669;"><i class="fa-solid fa-circle-check"></i></div>
          <h4 style="margin:5px 0; color:#059669; font-weight:bold;">TẠO VÉ THÀNH CÔNG</h4>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:.9rem; border-top:1px dashed #ccc; padding-top:10px;">
          <div>
            <span class="text-muted small">Mã đơn</span>
            <div style="font-weight:bold; color:#2563eb; font-size:1.1rem;">${escapeHtml(bookingCode)}</div>
          </div>
          <div>
            <span class="text-muted small">Khách hàng</span>
            <div class="fw-semibold">${escapeHtml(name)} (${escapeHtml(phone || 'N/A')})</div>
          </div>
          <div style="grid-column:span 2; background:#f3e8ff; padding:8px; border-radius:6px;">
            <span style="color:#6b21a8; font-size:.8rem; font-weight:bold;">Mã vé từng ghế:</span>
            <div style="font-size:.95rem; margin-top:2px;">${ticketDetailsList}</div>
          </div>
          <div>
            <span class="text-muted small">Phim</span>
            <div class="fw-semibold">${escapeHtml(movieName)}</div>
          </div>
          <div>
            <span class="text-muted small">Suất chiếu</span>
            <div class="fw-semibold">${escapeHtml(showtimeInfo)}</div>
          </div>
          <div>
            <span class="text-muted small">${seatCount >= 2 ? 'Danh sách ghế' : 'Ghế chọn'}</span>
            <div class="fw-semibold">${seatLabelDisplay}</div>
          </div>
          <div>
            <span class="text-muted small">Phòng chiếu</span>
            <div class="fw-semibold">${escapeHtml(roomName)}</div>
          </div>
          <div>
            <span class="text-muted small">Tổng giá ghế (${seatCount} ghế)</span>
            <div class="fw-semibold text-dark">${formatCurrency(seatPriceTotal)}</div>
          </div>
          ${state.selectedCombo ? '' : promoHtml}
          ${comboHtml}
          ${state.selectedCombo ? promoHtml : ''}
          <div style="grid-column:span 2; border-top:1px solid #e2e8f0; padding-top:8px; margin-top:5px;">
            <span class="text-muted small">Tổng thanh toán</span>
            <div style="font-weight:bold; color:#059669; font-size:1.2rem;">${formatCurrency(finalAmount)}</div>
          </div>
        </div>
      </div>
    `;

    showAppModal('Thông Báo Đặt Vé', printHtml, true);
    resetBookingFlow(true);
  } catch (err) {
    console.error('[Lỗi tạo vé]:', err);
    const message = err.message || 'Không thể tạo đơn hàng.';
    let title = 'Thất bại';

    if (message.toLowerCase().includes('hết hàng')) title = 'Sản phẩm hết hàng';
    else if (message.toLowerCase().includes('ghế')) title = 'Ghế không khả dụng';

    showAppModal(title, escapeHtml(message));
  } finally {
    if (button) {
      button.disabled = state.selectedSeats.length === 0;
      button.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i> Tạo vé & Thanh toán`;
    }
  }
}

/* =========================================================
   RESET
========================================================= */

function resetBookingFlow(softReset = false) {
  state.selectedSeats = [];
  state.selectedCombo = null;
  state.highlightSeat = null;
  state.appliedPromo = null;

  const promoInput = document.getElementById('promo-code-input') || document.getElementById('promoCodeInput');
  if (promoInput) promoInput.value = '';

  const promoMessage = document.getElementById('promo-code-message');
  if (promoMessage) {
    promoMessage.className = 'text-muted small mt-1';
    promoMessage.textContent = '';
  }

  const comboSelect = document.getElementById('combo-select');
  if (comboSelect) comboSelect.value = '';

  const comboOptions = document.getElementById('combo-options');
  if (comboOptions) comboOptions.style.display = 'none';

  document.querySelectorAll('.drink-checkbox, .popcorn-checkbox').forEach(cb => cb.checked = false);

  const form = document.getElementById('create-ticket-form');
  if (form) form.reset();

  const total = document.getElementById('total-price');
  const seatPrice = document.getElementById('seat-price');
  const comboPrice = document.getElementById('combo-price');
  const discountPrice = document.getElementById('discount-price');

  if (total) total.textContent = '0 ₫';
  if (seatPrice) seatPrice.textContent = '0 ₫';
  if (comboPrice) comboPrice.textContent = '0 ₫';
  if (discountPrice) discountPrice.textContent = '-0 ₫';

  updateSeatLabels();

  if (softReset) {
    if (typeof renderSeatMap === 'function') renderSeatMap(true);
    return;
  }

  state.selectedMovie = null;
  state.selectedShowtime = null;
  state.seatLayout = null;
  state.occupiedSeats = [];
  state.occupiedDetails = {};

  const movieSelect = document.getElementById('movie-select');
  if (movieSelect) movieSelect.value = '';

  const roomSelect = document.getElementById('room-filter');
  if (roomSelect) roomSelect.value = '';

  const showtimeSection = document.getElementById('showtime-section');
  if (showtimeSection) showtimeSection.style.display = 'none';

  const showtimeList = document.getElementById('showtime-list');
  if (showtimeList) showtimeList.innerHTML = '';

  const checkout = document.getElementById('checkout-section');
  if (checkout) checkout.style.display = 'none';

  const mapArea = document.getElementById('seat-map-area');
  if (mapArea) mapArea.style.display = 'none';

  const placeholder = document.getElementById('map-placeholder');
  if (placeholder) placeholder.style.display = 'block';
}

/* =========================================================
   CHECK TICKET
========================================================= */

async function checkTicket() {
  const input = document.getElementById('ticket-code');
  const code = input ? input.value.trim().toUpperCase() : '';

  if (!code) {
    showAppModal('Cảnh báo', 'Vui lòng nhập Mã vé hoặc Mã đặt chỗ!');
    return;
  }

  const resultBox = document.getElementById('check-result');
  const statusText = document.getElementById('result-status-text');
  const resultCode = document.getElementById('result-code');
  const badge = document.getElementById('result-badge');
  const details = document.getElementById('result-details');

  try {
    const response = await apiRequest(`/counter/tickets/locate?code=${encodeURIComponent(code)}`);
    const result = response.ticket;
    const seatMapData = response.seatMap;
    const paymentMethod = String(result.paymentMethod || 'COUNTER').toUpperCase();
    const isAppTicket = paymentMethod === 'APP';

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.className = 'result-box valid';
    }

    if (resultCode) {
      resultCode.textContent = 'Mã: ' + (result.ticketCode || result.ticketId || code);
    }

    if (details) {
      details.innerHTML = `
        <div class="col-6">
          <small class="text-muted">Mã Vé / Đơn</small>
          <div class="fw-bold">${escapeHtml(result.ticketCode || result.ticketId || code)}</div>
        </div>
        <div class="col-6">
          <small class="text-muted">Hình thức</small>
          <div class="fw-bold" style="color:${isAppTicket ? '#2563eb' : '#059669'};">
            ${isAppTicket ? 'Đặt qua APP' : 'Mua tại Quầy'}
          </div>
        </div>
        <div class="col-6">
          <small class="text-muted">Khách hàng</small>
          <div class="fw-semibold">${escapeHtml(result.customerName || '')} - ${escapeHtml(result.customerPhone || 'N/A')}</div>
        </div>
        <div class="col-6">
          <small class="text-muted">Phim</small>
          <div class="fw-semibold">${escapeHtml(result.movieTitle || '')}</div>
        </div>
        <div class="col-6">
          <small class="text-muted">Ghế / Phòng</small>
          <div class="fw-semibold">${escapeHtml(result.seatNumber || '')} (${escapeHtml(result.roomName || '')})</div>
        </div>
        <div class="col-6">
          <small class="text-muted">Suất chiếu</small>
          <div class="fw-semibold">${escapeHtml(result.startTime || '')} - ${escapeHtml(result.showDate || '')}</div>
        </div>
        <div class="col-12">
          <small class="text-muted">Giá vé</small>
          <div class="fw-bold" style="color:#059669;">${formatCurrency(result.price)}</div>
        </div>
      `;
    }

    if (isAppTicket) {
      if (statusText) {
        statusText.innerHTML = `<i class="fa-solid fa-circle-check me-2" style="color:#059669;"></i> Soát vé APP thành công`;
        statusText.style.color = '#059669';
      }
      if (badge) {
        badge.innerHTML = `<span class="badge-valid" style="background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:6px; font-weight:600;">HỢP LỆ (APP)</span>`;
      }
      showAppModal('Vé Hợp Lệ (APP)', `Mã đặt chỗ <b>${escapeHtml(code)}</b> (Đặt qua App) hợp lệ!`);
    } else {
      if (statusText) {
        statusText.innerHTML = `<i class="fa-solid fa-circle-info me-2" style="color:#2563eb;"></i> Vé mua tại quầy`;
        statusText.style.color = '#2563eb';
      }
      if (badge) {
        badge.innerHTML = `<span class="badge-valid" style="background:#dbeafe; color:#1e40af; padding:4px 8px; border-radius:6px; font-weight:600;">VÉ QUẦY</span>`;
      }
      showAppModal('Thông Tin Vé', `Mã vé <b>${escapeHtml(code)}</b> là vé mua trực tiếp tại quầy.<br>Thông tin vé đã được kiểm tra thành công!`);
    }

    locateAndHighlightSeat(seatMapData, result.seatNumber, result);
  } catch (err) {
    console.error('[Check Ticket Error]', err);

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.className = 'result-box invalid';
    }

    if (statusText) {
      statusText.innerHTML = `<i class="fa-solid fa-circle-xmark me-2" style="color:#dc2626;"></i> Không hợp lệ`;
      statusText.style.color = '#dc2626';
    }

    if (badge) {
      badge.innerHTML = `<span class="badge-invalid" style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:6px; font-weight:600;">KHÔNG HỢP LỆ</span>`;
    }

    if (resultCode) resultCode.textContent = 'Mã: ' + code;

    if (details) {
      details.innerHTML = `<div class="col-12 text-muted">${escapeHtml(err.message || 'Mã vé/mã đặt chỗ không tồn tại hoặc đã bị hủy.')}</div>`;
    }

    showAppModal('Mã Vé Không Hợp Lệ', `Mã vé hoặc mã đặt chỗ <b>${escapeHtml(code)}</b> không hợp lệ hoặc không tồn tại trên hệ thống!`);
  }
}

/* =========================================================
   LOCATE TICKET SEAT
========================================================= */

function locateAndHighlightSeat(seatMapData, seatCode, ticketResult) {
  if (!seatMapData) return;

  state.selectedMovie = {
    id: seatMapData.movieId,
    title: seatMapData.movieTitle,
    regularPrice: Number(seatMapData.regularPrice || 0),
    vipPrice: Number(seatMapData.vipPrice || 0)
  };

  state.selectedShowtime = {
    id: seatMapData.showtimeId,
    time: seatMapData.startTime,
    date: seatMapData.showDate,
    roomName: seatMapData.roomName,
    roomId: seatMapData.roomId
  };

  state.seatLayout = seatMapData;
  state.selectedSeats = [];
  state.occupiedSeats = [
    ...(seatMapData.soldSeats || []),
    ...(seatMapData.holdingSeats || [])
  ];

  state.occupiedDetails = {};

  if (Array.isArray(seatMapData.seatDetails)) {
    seatMapData.seatDetails.forEach(detail => {
      const key = String(detail.seatCode).trim().toUpperCase();
      state.occupiedDetails[key] = {
        customerName: detail.customerName,
        customerPhone: detail.customerPhone,
        ticketCode: detail.ticketCode,
        seatType: detail.seatType,
        ticketPrice: detail.ticketPrice,
        bookingCode: detail.bookingCode,
        comboName: detail.comboName,
        comboPrice: detail.comboPrice,
        totalAmount: detail.totalAmount,
        paymentMethod: detail.paymentMethod || 'COUNTER',
        isVerified: detail.isVerified || false
      };
    });
  }

  const targetSeat = String(seatCode || '').trim().toUpperCase();

  if (targetSeat && ticketResult) {
    const existing = state.occupiedDetails[targetSeat] || {};
    state.occupiedDetails[targetSeat] = {
      ...existing,
      customerName: ticketResult.customerName || existing.customerName,
      customerPhone: ticketResult.customerPhone || existing.customerPhone,
      ticketCode: ticketResult.ticketCode || existing.ticketCode,
      seatType: ticketResult.seatType || existing.seatType,
      ticketPrice: ticketResult.price ?? existing.ticketPrice,
      bookingCode: ticketResult.bookingCode || existing.bookingCode,
      paymentMethod: ticketResult.paymentMethod || existing.paymentMethod || 'COUNTER'
    };
  }

  state.highlightSeat = targetSeat;
  renderSeatMap(false);

  const seatMapArea = document.getElementById('seat-map-area');
  if (seatMapArea) {
    seatMapArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}