const API_BASE_URL = '/api';

let state = {
  selectedMovie: null,
  selectedShowtime: null,
  selectedCombo: null,
  selectedSeats: [],
  seatLayout: null,
  occupiedSeats: [],
  occupiedDetails: {},
  highlightSeat: null
};

function extractArrayData(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
}

function parseRoomLayout(raw) {
  if (!raw) return { rows: 5, cols: 6, hasAisle: false, vipSeats: [], seatCodeMap: {} };

  let obj = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch (e) { obj = {}; }
  }

  // Mảng ghế nằm trong obj.seatLayout (theo response backend hiện tại)
  let seatArray = [];
  if (Array.isArray(obj)) {
    seatArray = obj;
  } else if (obj && typeof obj === 'object' && Array.isArray(obj.seatLayout)) {
    seatArray = obj.seatLayout;
  }

  let rows = 0;
  let cols = 0;
  let vipSeats = [];
  let seatCodeMap = {};

  // rows/cols lấy trực tiếp từ obj.soHangGhe / obj.soCotGhe (field chuẩn từ backend)
  if (!Array.isArray(obj) && obj) {
    rows = parseInt(obj.soHangGhe) || 0;
    cols = parseInt(obj.soCotGhe) || 0;
  }

  if (seatArray.length > 0) {
    let maxRowIdx = -1;
    let maxColNum = 0;

    seatArray.forEach(s => {
      let code = s.code;
      let type = s.type;

      let rIdx = -1;
      let cNum = -1;

      // Backend trả row dạng chữ cái ('A','B'...) và col dạng số
      if (s.row !== undefined) {
        let rVal = String(s.row).trim().toUpperCase();
        if (/^[A-Z]+$/.test(rVal)) rIdx = rVal.charCodeAt(0) - 65;
        else if (!isNaN(parseInt(rVal))) rIdx = parseInt(rVal) - 1;
      }
      if (s.col !== undefined) {
        cNum = parseInt(s.col);
      }

      // fallback: suy ra từ code nếu row/col thiếu
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

  // ĐỌC ĐÚNG field coLoiDi (Boolean) từ object cha
  let hasAisle = false;
  if (!Array.isArray(obj) && obj) {
    hasAisle = obj.coLoiDi === true;
  }

  return { rows, cols, hasAisle, vipSeats, seatCodeMap };
}

function formatCurrency(n) {
  return new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫';
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi máy chủ (${response.status})`);
    }
    return await response.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

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
  const showtimeStr = (state.selectedShowtime?.time && state.selectedShowtime?.time !== '--:--')
    ? `${state.selectedShowtime.time} (${state.selectedShowtime.date})`
    : 'N/A';

  let detailsHtml = `
    <div style="font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px; font-size: 0.9rem; color: #f8fafc;">
      <i class="fa-solid fa-couch me-1"></i> Ghế: ${seatId} <span style="font-size:0.75rem; font-weight:normal; color:#cbd5e1;">(${seatType})</span>
    </div>
    <div><b>Trạng thái:</b> <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
    <div><b>Phòng chiếu:</b> ${roomName}</div>
  `;

  if (state.selectedMovie?.title) {
    detailsHtml += `<div><b>Phim:</b> ${movieTitle}</div>`;
    detailsHtml += `<div><b>Suất chiếu:</b> ${showtimeStr}</div>`;
  }

  if (isOccupied) {
    const custInfo = state.occupiedDetails[seatId] || {};
    detailsHtml += `
      <div style="margin-top: 6px; border-top: 1px dashed #475569; padding-top: 6px; color: #f1f5f9;">
        <div><b>Khách hàng:</b> ${custInfo.customerName || 'Đã mua vé'}</div>
        <div><b>SĐT:</b> ${custInfo.customerPhone || 'N/A'}</div>
        ${custInfo.ticketCode ? `<div><b>Mã vé:</b> <span style="color:#a78bfa;">${custInfo.ticketCode}</span></div>` : ''}
      </div>
    `;
  }

  tooltip.innerHTML = detailsHtml;
  tooltip.classList.add('active');
  moveSeatTooltip(evt);
}

// Cập nhật vị trí thông minh - Tự động lật lên trên nếu chạm đáy màn hình
function moveSeatTooltip(evt) {
  const tooltip = document.getElementById('seat-hover-tooltip');
  if (!tooltip || !tooltip.classList.contains('active')) return;

  const tooltipWidth = tooltip.offsetWidth || 260;
  const tooltipHeight = tooltip.offsetHeight || 180;

  let x = evt.clientX + 14;
  let y = evt.clientY + 14;

  if (y + tooltipHeight > window.innerHeight - 10) {
    y = evt.clientY - tooltipHeight - 10;
  }

  if (x + tooltipWidth > window.innerWidth - 10) {
    x = evt.clientX - tooltipWidth - 10;
  }

  if (x < 10) x = 10;
  if (y < 10) y = 10;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideSeatTooltip() {
  const tooltip = document.getElementById('seat-hover-tooltip');
  if (tooltip) tooltip.classList.remove('active');
}

function showAppModal(title, text, showPrintBtn = false) {
  initCustomModal();
  document.getElementById('custom-modal-title').innerHTML = `<i class="fa-solid fa-circle-info me-2"></i>${title}`;
  document.getElementById('custom-modal-body').innerHTML = text;

  const footer = document.getElementById('custom-modal-footer');
  if (showPrintBtn) {
    footer.innerHTML = `
      <button type="button" class="btn-modal-print no-print" onclick="window.print()"><i class="fa-solid fa-print me-1"></i> In phiếu vé</button>
      <button type="button" class="btn-modal-primary no-print" onclick="closeAppModal()">Đóng</button>
    `;
  } else {
    footer.innerHTML = `<button type="button" class="btn-modal-primary" onclick="closeAppModal()">Xác nhận</button>`;
  }

  document.getElementById('app-custom-modal').classList.add('active');
}

function closeAppModal() {
  const modal = document.getElementById('app-custom-modal');
  if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  initCustomModal();
  initTooltipElement();
  initInitialData();
});

async function initInitialData() {
  await loadMoviesDropdown();
  await loadCombosDropdown();
  await loadRoomsDropdown();
  await loadComboOptionsData();
}

async function loadMoviesDropdown() {
  try {
    const res = await apiRequest('/movies');
    const movies = extractArrayData(res);
    const select = document.getElementById('movie-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn tên phim --</option>';
    movies.forEach(m => {
      select.innerHTML += `<option value="${m.id}" data-title="${m.title}" data-regular="${m.regularPrice || 80000}" data-vip="${m.vipPrice || 90000}">${m.title}</option>`;
    });
  } catch (err) {
    console.error('[Lỗi Load Phim]:', err.message);
  }
}

async function loadCombosDropdown() {
  try {
    const res = await apiRequest('/combos');
    const combos = extractArrayData(res);
    const select = document.getElementById('combo-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Không chọn combo --</option>';
    combos.forEach(c => {
      const price = c.totalPrice || c.price || 0;
      select.innerHTML += `<option value="${c.id}" data-price="${price}">${c.name} (${formatCurrency(price)})</option>`;
    });
  } catch (err) {
    console.error('[Lỗi Load Combo]:', err.message);
  }
}

async function loadRoomsDropdown() {
  try {
    const res = await apiRequest('/rooms');
    const rooms = extractArrayData(res);
    const select = document.getElementById('room-filter');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn phòng --</option>';
    rooms.forEach(r => {
      const roomTitle = r.tenPhong || r.name || ('phong chieu ' + r.id);
      select.innerHTML += `<option value="${r.id}">${roomTitle}</option>`;
    });

    select.onchange = (e) => onRoomFilterChange(e.target.value);
  } catch (err) {
    console.error('[Lỗi Load Phòng]:', err.message);
  }
}

async function loadComboOptionsData() {
  try {
    const [drinksRes, popcornsRes] = await Promise.all([
      apiRequest('/products?type=DRINK').catch(() => null),
      apiRequest('/products?type=POPCORN').catch(() => null)
    ]);

    renderComboItemsUI(extractArrayData(drinksRes), extractArrayData(popcornsRes));
  } catch (err) {
    renderComboItemsUI([], []);
  }
}

function renderComboItemsUI(drinks, popcorns) {
  const drinkContainer = document.getElementById('drink-list');
  const popcornContainer = document.getElementById('popcorn-list');

  if (drinkContainer) {
    drinkContainer.innerHTML = drinks.length > 0
      ? drinks.map(item => `
        <div class="form-check">
          <input class="form-check-input drink-checkbox" type="checkbox" name="drink" value="${item.name}" id="drink-${item.id}" onchange="validateComboSelection(this, 'drink')">
          <label class="form-check-label" for="drink-${item.id}">${item.name}</label>
        </div>
      `).join('') : '<small class="text-muted">Không có dữ liệu nước</small>';
  }

  if (popcornContainer) {
    popcornContainer.innerHTML = popcorns.length > 0
      ? popcorns.map(item => `
        <div class="form-check">
          <input class="form-check-input popcorn-checkbox" type="checkbox" name="popcorn" value="${item.name}" id="popcorn-${item.id}" onchange="validateComboSelection(this, 'popcorn')">
          <label class="form-check-label" for="popcorn-${item.id}">${item.name}</label>
        </div>
      `).join('') : '<small class="text-muted">Không có dữ liệu bắp</small>';
  }
}

function validateComboSelection(currentCheckbox, type) {
  const selector = type === 'popcorn' ? 'input[name="popcorn"]:checked' : 'input[name="drink"]:checked';
  const checkedItems = document.querySelectorAll(selector);

  if (checkedItems.length > 1) {
    currentCheckbox.checked = false;
    const typeText = type === 'popcorn' ? 'bắp' : 'nước';
    showAppModal('Cảnh báo', `Bạn chỉ được chọn tối đa 1 loại <b>${typeText}</b> cho combo này!`);
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
      const allRoomsRes = await apiRequest('/rooms');
      const rooms = extractArrayData(allRoomsRes);
      roomData = rooms.find(r => String(r.id) === String(roomId));
    }

    if (!roomData) {
      showAppModal('Thông báo', 'Không tìm thấy thông tin phòng chiếu.');
      return;
    }

    const roomTitle = roomData.tenPhong || roomData.name || ('Phòng ' + roomId);
    state.selectedShowtime = {
      id: null,
      time: '--:--',
      date: 'Xem trực tiếp phòng',
      roomName: roomTitle,
      roomId: roomId
    };

   state.seatLayout = roomData;
   state.occupiedSeats = roomData.soldSeats || [];
   state.occupiedDetails = {};

   if (Array.isArray(roomData.seatDetails)) {   // sửa res -> roomData
     roomData.seatDetails.forEach(d => {
       const key = String(d.seatCode).trim().toUpperCase();
       state.occupiedDetails[key] = {
         customerName: d.customerName,
         customerPhone: d.customerPhone,
         ticketCode: d.ticketCode,
         seatType: d.seatType,
         ticketPrice: d.ticketPrice,
         bookingCode: d.bookingCode,
         comboName: d.comboName,
         comboPrice: d.comboPrice,
         totalAmount: d.totalAmount
       };
     });
   }

   renderSeatMap(false);

  } catch (err) {
    showAppModal('Lỗi', 'Không thể tải sơ đồ phòng chiếu: ' + err.message);
  }
}

async function onMovieChange() {

  state.highlightSeat = null;
  const selectEl = document.getElementById('movie-select');
  const movieId = selectEl ? selectEl.value : '';
  const selectedOpt = selectEl ? selectEl.options[selectEl.selectedIndex] : null;

  if (!movieId) {
    state.selectedMovie = null;
    state.selectedShowtime = null;
    state.selectedSeats = [];
    document.getElementById('showtime-section').style.display = 'none';
    document.getElementById('checkout-section').style.display = 'none';
    return;
  }

  state.selectedMovie = {
    id: movieId,
    title: selectedOpt.getAttribute('data-title'),
    regularPrice: parseFloat(selectedOpt.getAttribute('data-regular')),
    vipPrice: parseFloat(selectedOpt.getAttribute('data-vip'))
  };

  try {
    const res = await apiRequest(`/counter/showtimes?movieId=${movieId}`);
    let showtimes = extractArrayData(res);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const currentTimeStr = now.toTimeString().slice(0, 5);

    const validShowtimes = showtimes.filter(st => {
      if (!st.showDate) return false;
      const stDate = st.showDate.includes('T') ? st.showDate.split('T')[0] : st.showDate;
      if (stDate > todayStr) return true;
      if (stDate === todayStr) {
        const stTime = st.startTime ? st.startTime.slice(0, 5) : '00:00';
        return stTime >= currentTimeStr;
      }
      return false;
    });

    const container = document.getElementById('showtime-list');

    if (validShowtimes.length === 0) {
      container.innerHTML = `
        <div class="alert alert-warning text-center p-2 my-2" style="font-size:0.85rem;">
          <i class="fa-solid fa-triangle-exclamation me-1"></i>
          Không có suất chiếu nào sắp tới.
        </div>
      `;
    } else {
      container.innerHTML = validShowtimes.map(st => {
        const safeRoomName = (st.roomName || 'Phòng chiếu').replace(/'/g, "\\'");
        return `
          <div class="showtime-item" data-id="${st.id}" onclick="selectShowtime('${st.id}', '${st.startTime}', '${st.showDate}', '${safeRoomName}', '${st.roomId || ''}')">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="time fw-bold">${st.startTime}</span>
                <span class="text-muted ms-2" style="font-size:0.85rem;">${st.showDate}</span>
              </div>
              <span class="badge-room">${st.roomName || 'Phòng chiếu'}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    document.getElementById('showtime-section').style.display = 'block';
    updateTotal();
  } catch (err) {
    showAppModal('Lỗi', 'Không thể lấy dữ liệu suất chiếu: ' + err.message);
  }
}

// Tự động đồng bộ dropdown bộ lọc phòng chiếu khi chọn bất kỳ suất chiếu nào
async function selectShowtime(showtimeId, time, date, roomName, roomId) {
state.highlightSeat = null;
  try {
    state.selectedShowtime = { id: showtimeId, time, date, roomName, roomId };
    state.selectedSeats = [];

    // Đồng bộ giá trị của Dropdown Bộ lọc phòng chiếu phía trên
    const roomSelect = document.getElementById('room-filter');
    if (roomSelect) {
      if (roomId) {
        roomSelect.value = roomId;
      } else if (roomName) {
        for (let i = 0; i < roomSelect.options.length; i++) {
          if (roomSelect.options[i].text.trim().toLowerCase() === roomName.trim().toLowerCase()) {
            roomSelect.selectedIndex = i;
            break;
          }
        }
      }
    }

    document.querySelectorAll('.showtime-item').forEach(el => {
      el.classList.toggle('selected', String(el.dataset.id) === String(showtimeId));
    });

    let res = null;
    try {
      res = await apiRequest(`/counter/seat-map/${showtimeId}`);
   } catch (err) {
     if (roomId) {
       const roomRes = await apiRequest(`/rooms/${roomId}`).catch(() => null);
       if (roomRes) {
         res = {
           seatLayout: roomRes.seatLayout,
           coLoiDi: roomRes.coLoiDi,
           soHangGhe: roomRes.soHangGhe,
           soCotGhe: roomRes.soCotGhe,
           soldSeats: [],
           holdingSeats: [],
           seatDetails: []
         };
       }
     }
     if (!res) throw new Error('Máy chủ Backend gặp lỗi khi tải sơ đồ ghế.');
   }

    state.seatLayout = res; // giữ nguyên toàn bộ response (chứa seatLayout, coLoiDi, soHangGhe, soCotGhe)
    state.occupiedSeats = [...(res.soldSeats || []), ...(res.holdingSeats || [])];
    state.occupiedDetails = {};

    if (Array.isArray(res.seatDetails)) {
      res.seatDetails.forEach(d => {
        const key = String(d.seatCode).trim().toUpperCase();
        state.occupiedDetails[key] = {
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          ticketCode: d.ticketCode,
          seatType: d.seatType,           // <-- thêm
          ticketPrice: d.ticketPrice,     // <-- thêm
          bookingCode: d.bookingCode,     // <-- thêm
          comboName: d.comboName,         // <-- thêm
          comboPrice: d.comboPrice,       // <-- thêm
          totalAmount: d.totalAmount      // <-- thêm
        };
      });
    }

    if (res.regularPrice) state.selectedMovie.regularPrice = res.regularPrice;
    if (res.vipPrice) state.selectedMovie.vipPrice = res.vipPrice;

    renderSeatMap(true);
    document.getElementById('checkout-section').style.display = 'block';
    updateTotal();
  } catch (err) {
    showAppModal('Lỗi Server', err.message);
  }
}

function renderSeatMap(canSelect = true) {
  if (!state.selectedShowtime || !state.seatLayout) return;
  console.log(state.seatLayout)
  const { rows, cols, hasAisle, vipSeats, seatCodeMap } = parseRoomLayout(state.seatLayout);
  const vipSeatsSet = new Set(vipSeats.map(v => String(v).toUpperCase()));

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
      : `${state.selectedShowtime.roomName}`;
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let html = `
    <div class="screen-area"><div class="screen-shape"><span>MÀN HÌNH</span></div></div>
    <div class="seat-grid-matrix" style="display: grid; grid-template-columns: repeat(${finalCols}, auto); gap: 10px 8px; justify-content: center; align-items: center; width: fit-content; margin: 20px auto; max-width: 100%; overflow-x: auto;">
  `;

  for (let r = 0; r < rows; r++) {
    const rowLabel = alphabet[r] || `R${r + 1}`;
    let seatNumInRow = 1;

    for (let c = 0; c < finalCols; c++) {
      if (hasAisle && c === aisleIndex) {
        html += `<div class="seat-preview-box aisle"></div>`;
        continue;
      }

      const colLabel = seatNumInRow < 10 ? '0' + seatNumInRow : seatNumInRow;
      const defaultSeatId = `${rowLabel}${colLabel}`;

      const mappedCode = seatCodeMap[`${r}_${seatNumInRow}`];
      const seatId = mappedCode ? String(mappedCode).toUpperCase() : defaultSeatId;

      const isOccupied = state.occupiedSeats.some(s => String(s).toUpperCase() === seatId);
      const isSelected = state.selectedSeats.some(s => String(s).toUpperCase() === seatId);
      const isVipSeat = vipSeatsSet.has(seatId);
      const isHighlighted = state.highlightSeat === seatId;

      let cls = 'seat-preview-box seat';
      let content = seatId;

      if (isHighlighted) {
        cls += ' highlight-checked';   // class CSS mới, cần thêm style riêng (ví dụ viền vàng nhấp nháy)
        content = `${seatId} <i class="fa-solid fa-user-check ms-1"></i>`;
      } else if (isOccupied) {
        cls += ' sold';
        content = `${seatId} <i class="fa-solid fa-check ms-1"></i>`;
      } else if (isSelected) {
        cls += ' selected';
        content = `<i class="fa-solid fa-check"></i>`;
      } else if (isVipSeat) {
        cls += ' vip';
      }

      const clickAttr = `onclick="handleSeatClick('${seatId}', ${isOccupied}, ${canSelect})"`;
      const mouseAttr = `onmouseenter="showSeatTooltip(event, '${seatId}', ${isOccupied}, ${isSelected}, ${isVipSeat})" onmousemove="moveSeatTooltip(event)" onmouseleave="hideSeatTooltip()"`;

      html += `<div class="${cls}" data-seat="${seatId}" ${clickAttr} ${mouseAttr}>${content}</div>`;
      seatNumInRow++;
    }
  }

  html += `</div>
      <div class="seat-legend d-flex justify-content-center gap-3 mt-3 flex-wrap">
        <div class="legend-item"><span class="legend-box normal"></span> Ghế thường</div>
        <div class="legend-item"><span class="legend-box vip" style="background-color:#f59e0b;"></span> Ghế VIP</div>
        <div class="legend-item"><span class="legend-box sold" style="background-color:#22c55e;"></span> Đã chọn</div>
        <div class="legend-item"><span class="legend-box selected" style="background-color:#3b82f6;"></span> Đặt trước</div>
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

// Hiển thị thông tin đặt vé của ghế đã đặt trước, dạng giống form xác nhận thanh toán thành công
function showOccupiedSeatInfo(seatId) {
  const info = state.occupiedDetails[seatId] || {};

  // Dùng đúng seatType/giá thật từ backend, không tự đoán lại ở frontend
  const isVipSeat = info.seatType === 'VIP';
  const seatPrice = info.ticketPrice != null ? info.ticketPrice : 0;

  const hasCombo = info.comboName && info.comboName !== 'Không';
  const comboPrice = info.comboPrice || 0;
  const totalAmount = info.totalAmount != null ? info.totalAmount : (seatPrice + (hasCombo ? comboPrice : 0));

  const comboRowHtml = hasCombo ? `
    <div style="grid-column: span 2; background: #f1f5f9; padding: 8px; border-radius: 6px; margin-top: 4px;">
      <span style="color: #475569; font-size: 0.8rem; font-weight: bold;">Combo: ${info.comboName}</span>
      <div style="font-size: 0.85rem; color: #334155;">
        <b>(${formatCurrency(comboPrice)})</b>
      </div>
    </div>
  ` : '';

  const printHtml = `
    <div id="printable-ticket-area" style="text-align: left; background: #ffffff; padding: 10px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 2rem; color: #22c55e;"><i class="fa-solid fa-circle-check"></i></div>
        <h4 style="margin: 5px 0; color: #22c55e; font-weight: bold;">Vé đã thanh toán</h4>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; border-top: 1px dashed #ccc; padding-top: 10px;">
        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Mã vé</span>
          <div style="font-weight: bold; color: #2563eb; font-size: 1.1rem;">${info.ticketCode || 'N/A'}</div>
        </div>
        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Mã đơn</span>
          <div style="font-weight: bold; color: #2563eb; font-size: 1.1rem;">${info.bookingCode || 'N/A'}</div>
        </div>

        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Khách hàng</span>
          <div style="font-weight: 600;">${info.customerName || 'Đã mua vé'} (${info.customerPhone || 'N/A'})</div>
        </div>
        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Ghế</span>
          <div style="font-weight: 600;">${seatId} ${isVipSeat ? '<span style="color:#f59e0b;">(VIP)</span>' : '<span style="color:#64748b;">(Thường)</span>'}</div>
        </div>

        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Phòng chiếu</span>
          <div style="font-weight: 600;">${state.selectedShowtime?.roomName || 'N/A'}</div>
        </div>
        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Phim</span>
          <div style="font-weight: 600;">${state.selectedMovie?.title || 'N/A'}</div>
        </div>

        <div style="grid-column: span 2;">
          <span style="color: #64748b; font-size: 0.8rem;">Suất chiếu</span>
          <div style="font-weight: 600;">${state.selectedShowtime?.time || ''} ${state.selectedShowtime?.date || ''}</div>
        </div>

        ${comboRowHtml}

        <div>
          <span style="color: #64748b; font-size: 0.8rem;">Giá vé (ghế này)</span>
          <div style="font-weight: 600;">${formatCurrency(seatPrice)}</div>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 5px;">
          <span style="color: #64748b; font-size: 0.8rem;">Tổng thanh toán (cả đơn)</span>
          <div style="font-weight: bold; color: #22c55e; font-size: 1.2rem;">${formatCurrency(totalAmount)}</div>
        </div>
      </div>
    </div>
  `;

  showAppModal('Thông Tin Đặt Vé', printHtml, true);
}

function toggleSeat(seatId) {
  if (!state.selectedShowtime || state.occupiedSeats.some(s => String(s).toUpperCase() === String(seatId).toUpperCase())) return;

  const idx = state.selectedSeats.indexOf(seatId);
  if (idx >= 0) {
    state.selectedSeats.splice(idx, 1);
  } else {
    state.selectedSeats.push(seatId);
  }

  renderSeatMap(true);
  updateTotal();
}

function updateSeatLabels() {
  const label = document.getElementById('selected-seats-label');
  const btn = document.getElementById('btn-create');

  if (label) {
    label.textContent = state.selectedSeats.length > 0 ? state.selectedSeats.sort().join(', ') : '—';
  }
  if (btn) {
    btn.disabled = state.selectedSeats.length === 0;
  }
}

function updateTotal() {
  if (!state.selectedMovie || state.selectedSeats.length === 0) {
    const totalEl = document.getElementById('total-price');
    if (totalEl) totalEl.textContent = '0 ₫';
    updateSeatLabels();
    return 0;
  }

  let total = 0;
  const regPrice = state.selectedMovie.regularPrice || 80000;
  const vipPrice = state.selectedMovie.vipPrice || 90000;

  const { vipSeats } = parseRoomLayout(state.seatLayout);
  const vipSeatsSet = new Set(vipSeats.map(v => String(v).toUpperCase()));

  state.selectedSeats.forEach(seatId => {
    const isVipSeat = vipSeatsSet.has(String(seatId).toUpperCase());
    total += isVipSeat ? vipPrice : regPrice;
  });

  if (state.selectedCombo) {
    total += state.selectedCombo.price;
  }

  const totalEl = document.getElementById('total-price');
  if (totalEl) totalEl.textContent = formatCurrency(total);
  updateSeatLabels();

  return total;
}

function onComboChange() {
  const comboSelect = document.getElementById('combo-select');
  const comboId = comboSelect ? comboSelect.value : '';
  const panel = document.getElementById('combo-options');

  if (!comboId) {
    state.selectedCombo = null;
    if (panel) panel.style.display = 'none';
    document.querySelectorAll('.drink-checkbox, .popcorn-checkbox').forEach(cb => cb.checked = false);
    updateTotal();
    return;
  }

  const selectedOpt = comboSelect.options[comboSelect.selectedIndex];
  state.selectedCombo = {
    id: comboId,
    name: selectedOpt.text,
    price: parseFloat(selectedOpt.getAttribute('data-price') || 0)
  };

  if (panel) panel.style.display = 'block';
  updateTotal();
}

function resetBookingFlow() {
  // Reset toàn bộ state về trạng thái ban đầu
  state.selectedMovie = null;
  state.selectedShowtime = null;
  state.selectedCombo = null;
  state.selectedSeats = [];
  state.seatLayout = null;
  state.occupiedSeats = [];
  state.occupiedDetails = {};
  state.highlightSeat = null;

  // Reset dropdown chọn phim
  const movieSelect = document.getElementById('movie-select');
  if (movieSelect) movieSelect.value = '';

  // Reset dropdown chọn phòng
  const roomSelect = document.getElementById('room-filter');
  if (roomSelect) roomSelect.value = '';

  // Ẩn khu vực suất chiếu và danh sách suất chiếu
  const showtimeSection = document.getElementById('showtime-section');
  if (showtimeSection) showtimeSection.style.display = 'none';
  const showtimeList = document.getElementById('showtime-list');
  if (showtimeList) showtimeList.innerHTML = '';

  // Ẩn khu vực thanh toán
  const checkoutSection = document.getElementById('checkout-section');
  if (checkoutSection) checkoutSection.style.display = 'none';

  // Ẩn sơ đồ ghế, hiện lại placeholder
  const mapArea = document.getElementById('seat-map-area');
  if (mapArea) mapArea.style.display = 'none';
  const placeholder = document.getElementById('map-placeholder');
  if (placeholder) placeholder.style.display = 'block';

  // Reset tổng tiền và nhãn ghế đã chọn
  const totalEl = document.getElementById('total-price');
  if (totalEl) totalEl.textContent = '0 ₫';
  const label = document.getElementById('selected-seats-label');
  if (label) label.textContent = '—';
  const btnCreate = document.getElementById('btn-create');
  if (btnCreate) btnCreate.disabled = true;

  // Reset combo
  const comboSelect = document.getElementById('combo-select');
  if (comboSelect) comboSelect.value = '';
  const comboOptions = document.getElementById('combo-options');
  if (comboOptions) comboOptions.style.display = 'none';
  document.querySelectorAll('.drink-checkbox, .popcorn-checkbox').forEach(cb => cb.checked = false);

  // Reset form khách hàng
  const form = document.getElementById('create-ticket-form');
  if (form) form.reset();
}

async function createTicket(e) {
  if (e) e.preventDefault();

  if (!state.selectedShowtime || state.selectedSeats.length === 0) {
    showAppModal('Cảnh báo', 'Vui lòng chọn suất chiếu và ghế!');
    return;
  }

  const name = document.getElementById('customer-name')?.value.trim();
  if (!name) {
    showAppModal('Cảnh báo', 'Vui lòng nhập tên khách hàng!');
    return;
  }

  const phone = document.getElementById('customer-phone')?.value.trim() || '';
  const selectedDrink = document.querySelector('input[name="drink"]:checked')?.value || null;
  const selectedPopcorn = document.querySelector('input[name="popcorn"]:checked')?.value || null;

  let seatTotal = 0;
  const regPrice = state.selectedMovie?.regularPrice || 80000;
  const vipPrice = state.selectedMovie?.vipPrice || 90000;

  const { vipSeats } = parseRoomLayout(state.seatLayout);
  const vipSeatsSet = new Set(vipSeats.map(v => String(v).toUpperCase()));

  state.selectedSeats.forEach(seatId => {
    const isVipSeat = vipSeatsSet.has(String(seatId).toUpperCase());
    seatTotal += isVipSeat ? vipPrice : regPrice;
  });

  const comboTotal = state.selectedCombo ? (state.selectedCombo.price || 0) : 0;
  const grandTotal = seatTotal + comboTotal;

  const bookingPayload = {
    showtimeId: state.selectedShowtime.id,
    customerName: name,
    customerPhone: phone,
    selectedSeats: state.selectedSeats,
    comboId: state.selectedCombo ? state.selectedCombo.id : null,
    comboPrice: comboTotal,
    seatPrice: seatTotal,
    totalAmount: grandTotal,
    selectedDrink,
    selectedPopcorn
  };

  try {
    const response = await apiRequest('/counter/booking', 'POST', bookingPayload);

    const finalAmount = (response && response.totalAmount && response.totalAmount >= grandTotal)
      ? response.totalAmount
      : grandTotal;

    const ticketDetailsList = response.tickets && response.tickets.length > 0
      ? response.tickets.map(t => `<b>${t.seatCode || t.seatNumber}</b>: <span style="color:#7c3aed;">${t.ticketCode || t.id}</span>`).join('<br>')
      : (response.seats || state.selectedSeats).map(s => `<b>${s}</b>`).join(', ');

    const comboDetailInfo = state.selectedCombo ? `
      <div style="grid-column: span 2; background: #f1f5f9; padding: 8px; border-radius: 6px; margin-top: 4px;">
        <span style="color: #475569; font-size: 0.8rem; font-weight: bold;">Combo: ${state.selectedCombo.name || ''}</span>
        <div style="font-size: 0.85rem; color: #334155;">
          ${selectedPopcorn ? '• Bắp: ' + selectedPopcorn + ' ' : ''}
          ${selectedDrink ? '• Nước: ' + selectedDrink + ' ' : ''}
          <b>(${formatCurrency(comboTotal)})</b>
        </div>
      </div>
    ` : '';

    const printHtml = `
      <div id="printable-ticket-area" style="text-align: left; background: #ffffff; padding: 10px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <div style="font-size: 2rem; color: #059669;"><i class="fa-solid fa-circle-check"></i></div>
          <h4 style="margin: 5px 0; color: #059669; font-weight: bold;">TẠO VÉ THÀNH CÔNG</h4>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; border-top: 1px dashed #ccc; padding-top: 10px;">
          <div>
            <span style="color: #64748b; font-size: 0.8rem;">Mã đơn (Booking Code)</span>
            <div style="font-weight: bold; color: #2563eb; font-size: 1.1rem;">${response.bookingCode || 'N/A'}</div>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.8rem;">Khách hàng</span>
            <div style="font-weight: 600;">${name} (${phone || 'N/A'})</div>
          </div>

          <div style="grid-column: span 2; background: #f3e8ff; padding: 8px; border-radius: 6px;">
            <span style="color: #6b21a8; font-size: 0.8rem; font-weight: bold;">Mã vé từng ghế (Soát vé tại cửa):</span>
            <div style="font-size: 0.95rem; margin-top: 2px;">${ticketDetailsList}</div>
          </div>

          <div>
            <span style="color: #64748b; font-size: 0.8rem;">Phim</span>
            <div style="font-weight: 600;">${response.movieName || state.selectedMovie?.title}</div>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.8rem;">Suất chiếu</span>
            <div style="font-weight: 600;">${response.showtimeInfo || (state.selectedShowtime.time + ' ' + state.selectedShowtime.date)}</div>
          </div>

          <div>
            <span style="color: #64748b; font-size: 0.8rem;">Ghế chọn</span>
            <div style="font-weight: 600;">${state.selectedSeats.join(', ')}</div>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.8rem;">Phòng chiếu</span>
            <div style="font-weight: 600;">${response.roomName || state.selectedShowtime.roomName || 'N/A'}</div>
          </div>

          ${comboDetailInfo}

          <div style="grid-column: span 2; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 5px;">
            <span style="color: #64748b; font-size: 0.8rem;">Tổng thanh toán (Vé + Combo)</span>
            <div style="font-weight: bold; color: #059669; font-size: 1.2rem;">${formatCurrency(finalAmount)}</div>
          </div>
        </div>
      </div>
    `;

    showAppModal('Thông Báo Đặt Vé', printHtml, true);

    // Reset toàn bộ về trạng thái ban đầu, như lúc chưa chọn gì
    resetBookingFlow();

  } catch (err) {
    showAppModal('Thất bại', err.message || 'Không thể tạo đơn hàng.');
  }
 }

async function checkTicket() {
  const codeInput = document.getElementById('ticket-code');
  const code = codeInput ? codeInput.value.trim().toUpperCase() : '';

  if (!code) {
    showAppModal('Cảnh báo', 'Vui lòng nhập Mã vé!');
    return;
  }

  const resultBox = document.getElementById('check-result');
  const statusText = document.getElementById('result-status-text');
  const resultCode = document.getElementById('result-code');
  const badge = document.getElementById('result-badge');
  const details = document.getElementById('result-details');

  try {
    // Gọi endpoint gộp — chỉ 1 lần round-trip, lấy đủ cả vé + sơ đồ phòng
    const response = await apiRequest(`/counter/tickets/locate?code=${encodeURIComponent(code)}`);
    const result = response.ticket;
    const seatMapData = response.seatMap;

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.className = 'result-box valid';
    }
    if (statusText) {
      statusText.innerHTML = '<i class="fa-solid fa-circle-check me-2" style="color:#059669;"></i>Vé hợp lệ';
      statusText.style.color = '#059669';
    }
    if (badge) badge.innerHTML = '<span class="badge-valid" style="background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:6px; font-weight:600;">HỢP LỆ</span>';
    if (resultCode) resultCode.textContent = 'Mã vé: ' + (result.ticketCode || result.ticketId);

    if (details) {
      details.innerHTML = `
        <div class="col-6"><small class="text-muted">Mã Vé</small><div class="fw-bold">${result.ticketCode || result.ticketId}</div></div>
        <div class="col-6"><small class="text-muted">Trạng thái</small><div class="fw-semibold" style="color:#059669;">${result.status}</div></div>
        <div class="col-6"><small class="text-muted">Khách hàng</small><div class="fw-semibold">${result.customerName} - ${result.customerPhone}</div></div>
        <div class="col-6"><small class="text-muted">Phim</small><div class="fw-semibold">${result.movieTitle}</div></div>
        <div class="col-6"><small class="text-muted">Ghế / Phòng</small><div class="fw-semibold">${result.seatNumber} (${result.roomName})</div></div>
        <div class="col-6"><small class="text-muted">Suất chiếu</small><div class="fw-semibold">${result.startTime} - ${result.showDate}</div></div>
        <div class="col-12"><small class="text-muted">Giá vé</small><div class="fw-bold" style="color:#059669;">${formatCurrency(result.price)}</div></div>
      `;
    }

    // Cập nhật state để hiển thị đúng sơ đồ phòng của vé này, đồng thời tô sáng ghế
    locateAndHighlightSeat(seatMapData, result.seatNumber, result);

  } catch (err) {
    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.className = 'result-box invalid';
    }
    if (statusText) {
      statusText.innerHTML = '<i class="fa-solid fa-circle-xmark me-2" style="color:#dc2626;"></i>Không hợp lệ';
      statusText.style.color = '#dc2626';
    }
    if (badge) badge.innerHTML = '<span class="badge-invalid" style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:6px; font-weight:600;">KHÔNG HỢP LỆ</span>';
    if (resultCode) resultCode.textContent = 'Mã: ' + code;
    if (details) details.innerHTML = `<div class="col-12 text-muted">${err.message || 'Mã vé không tồn tại hoặc đã bị hủy.'}</div>`;
  }
}
function locateAndHighlightSeat(seatMapData, seatCode, ticketResult) {
  state.selectedMovie = {
    id: seatMapData.movieId,
    title: seatMapData.movieTitle,
    regularPrice: seatMapData.regularPrice,
    vipPrice: seatMapData.vipPrice
  };

  state.selectedShowtime = {
    id: seatMapData.showtimeId,
    time: seatMapData.startTime,
    date: seatMapData.showDate,
    roomName: seatMapData.roomName,
    roomId: seatMapData.roomId
  };

  state.seatLayout = seatMapData;
  state.selectedSeats = []; // không tính vào giỏ đặt vé, chỉ để xem
  state.occupiedSeats = [...(seatMapData.soldSeats || []), ...(seatMapData.holdingSeats || [])];
  state.occupiedDetails = {};

  if (Array.isArray(seatMapData.seatDetails)) {
    seatMapData.seatDetails.forEach(d => {
      const key = String(d.seatCode).trim().toUpperCase();
      state.occupiedDetails[key] = {
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        ticketCode: d.ticketCode
      };
    });
  }

  // Đánh dấu ghế cần tô sáng (khác với "đang chọn" để tránh ảnh hưởng tới việc tính tiền/đặt vé)
  state.highlightSeat = String(seatCode).trim().toUpperCase();

  renderSeatMap(false); // false = không cho phép bấm chọn ghế mới trong chế độ xem này

  // Cuộn tới khu vực sơ đồ để nhân viên thấy ngay
  document.getElementById('seat-map-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}