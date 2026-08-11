// Khai báo bộ nhớ tạm dữ liệu ứng dụng
let showtimesDatabase = [];
let systemMovies = [];
let systemRooms = [];
let systemCombos = [];
let systemProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Khởi tạo ứng dụng
async function initApp() {
    const dateInput = document.getElementById('dateFilter');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
    await Promise.all([
        fetchMovies(),
        fetchRooms(),
        fetchCombos(),
        fetchProducts()
    ]);


    await fetchShowtimes();
}


 function showCustomModal({
     title = 'Thông báo',
     message = '',
     type = 'info',
     confirmText = 'Đồng ý',
     cancelText = 'Hủy bỏ',
     onConfirm = null
 }) {
     // Xóa Modal cũ nếu đang tồn tại để tránh đè DOM
     const existingModal = document.getElementById('customSystemModal');
     if (existingModal) {
         const activeBsModal = bootstrap.Modal.getInstance(existingModal);
         if (activeBsModal) activeBsModal.dispose();
         existingModal.remove();
     }

     const isConfirm = typeof onConfirm === 'function';

     // Cấu hình Icon và Màu sắc theo 'type'
     let iconHeader = 'fa-circle-info';
     let headerBgClass = 'bg-primary';
     let confirmBtnClass = 'btn-primary';

     if (type === 'danger') {
         iconHeader = 'fa-triangle-exclamation';
         headerBgClass = 'bg-danger';
         confirmBtnClass = 'btn-danger';
     } else if (type === 'success') {
         iconHeader = 'fa-circle-check';
         headerBgClass = 'bg-success';
         confirmBtnClass = 'btn-success';
     } else if (type === 'warning' || type === 'orange') {
         iconHeader = 'fa-triangle-exclamation';
         headerBgClass = 'bg-warning text-dark';
         confirmBtnClass = 'btn-warning text-dark';
     }

     const modalHtml = `
         <div class="modal fade" id="customSystemModal" tabindex="-1" style="z-index: 1090;">
             <div class="modal-dialog modal-dialog-centered modal-sm">
                 <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">

                     <!-- Header -->
                     <div class="modal-header ${headerBgClass} px-3 py-2.5 border-0">
                         <h6 class="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                             <i class="fa-solid ${iconHeader}"></i> ${title}
                         </h6>
                         <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'}" data-bs-dismiss="modal" aria-label="Close"></button>
                     </div>

                     <!-- Body -->
                     <div class="modal-body p-4 text-center bg-white">
                         <div class="mb-0 text-secondary fw-semibold fs-6">${message}</div>
                     </div>

                     <!-- Footer -->
                     <div class="modal-footer bg-white p-2 border-0 justify-content-center gap-2">
                         ${isConfirm ? `<button type="button" class="btn btn-sm btn-outline-secondary px-3 rounded-3 fw-semibold" data-bs-dismiss="modal">${cancelText}</button>` : ''}
                         <button type="button" class="btn btn-sm ${confirmBtnClass} px-4 rounded-3 fw-bold" id="btnCustomModalConfirm">${confirmText}</button>
                     </div>

                 </div>
             </div>
         </div>`;

     document.body.insertAdjacentHTML('beforeend', modalHtml);
     const modalEl = document.getElementById('customSystemModal');
     const bsModal = new bootstrap.Modal(modalEl, { focus: true });

     document.getElementById('btnCustomModalConfirm').onclick = () => {
         bsModal.hide();
         if (isConfirm) {
             // Đợi hiệu ứng đóng modal hoàn tất rồi mới thực thi callback để tránh đè modal mới
             modalEl.addEventListener('hidden.bs.modal', () => {
                 onConfirm();
             }, { once: true });
         }
     };

     // Tự dọn dẹp DOM khi ẩn
     modalEl.addEventListener('hidden.bs.modal', () => {
         modalEl.remove();
     });

     bsModal.show();
 }

function customAlert(message, title = "Thông báo", type = "info") {
    showCustomModal({ title, message, type });
}

function customConfirm(message, onConfirm, title = "Xác nhận thao tác", type = "danger", confirmText = "Xác nhận") {
    showCustomModal({ title, message, type, confirmText, onConfirm });
}

// Gọi API lấy danh sách phim
async function fetchMovies() {
    try {
        const response = await fetch('/api/movies');
        if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
        const result = await response.json();
        if (result.success || Array.isArray(result)) {
            systemMovies = result.data || result;
            populateMovieDropdown();
        }
    } catch (error) {
        console.error("Lỗi tải danh sách phim:", error);
    }
}

// Gọi API lấy danh sách phòng chiếu
async function fetchRooms() {
    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
        const result = await response.json();
        if (result.success || Array.isArray(result)) {
            systemRooms = result.data || result;
        }
    } catch (error) {
        console.error("Lỗi tải danh sách phòng:", error);
    }
}

// Gọi API lấy danh sách suất chiếu
async function fetchShowtimes() {
    try {
        const response = await fetch('/api/showtimes');
        if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
        const result = await response.json();
        if (result.success || Array.isArray(result)) {
            showtimesDatabase = result.data || result;
            renderShowtimeCards();
        }
    } catch (error) {
        console.error("Lỗi tải danh sách suất chiếu:", error);
        const container = document.getElementById('cards-display-container');
        if (container) {
            container.innerHTML = `<div class="col-12 p-4 text-center text-danger bg-white rounded-4 border">Không thể kết nối đến máy chủ để tải lịch chiếu.</div>`;
        }
    }
}

// Gọi API lấy danh sách Combo
async function fetchCombos() {
    try {
        const response = await fetch('/api/combos');
        if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
        const result = await response.json();
        if (result.success || Array.isArray(result)) {
            systemCombos = result.data || result;
            renderComboCheckboxesInShowtimeModal();
            renderComboList();
        }
    } catch (error) {
        console.error("Lỗi tải danh sách Combo:", error);
    }
}

// Gọi API lấy danh sách Bắp/Nước
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
        const result = await response.json();
        if (result.success || Array.isArray(result)) {
            systemProducts = result.data || result;
            renderProductsInComboForm();
        }
    } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
    }
}

// Đổ danh sách phim vào dropdown
function populateMovieDropdown() {
    const movieSelect = document.getElementById('add-select-movie');
    if (!movieSelect) return;

    let optionsHtml = '<option value="" selected disabled>-- Chọn phim --</option>';
    systemMovies.forEach(m => {
        const duration = m.thoiLuong || m.duration || 0;
        const name = m.tenPhim || m.tenFilm || m.title || 'Phim không tên';
        optionsHtml += `<option value="${m.id}" data-duration="${duration}">${name}</option>`;
    });
    movieSelect.innerHTML = optionsHtml;
}

// Tự động cập nhật thời lượng phim
function onMovieSelectChange() {
    const movieSelect = document.getElementById('add-select-movie');
    const durationInput = document.getElementById('add-duration');
    if (!movieSelect || !durationInput) return;

    const selectedOption = movieSelect.options[movieSelect.selectedIndex];
    const duration = selectedOption ? selectedOption.getAttribute('data-duration') : '';
    durationInput.value = duration ? `${duration} phút` : '';
}

// Bật/Tắt khung chọn ngày lặp lại
function toggleRepeatDateFields() {
    const isRepeat = document.getElementById('repeat-switch')?.checked;
    const singleDateBox = document.getElementById('single-date-box');
    const rangeDateBox = document.getElementById('range-date-box');

    if (isRepeat) {
        singleDateBox?.classList.add('d-none');
        rangeDateBox?.classList.remove('d-none');
    } else {
        singleDateBox?.classList.remove('d-none');
        rangeDateBox?.classList.add('d-none');
    }
}

// Tạo ô nhập giờ chiếu và phòng chiếu cho từng Ca
function generateShowtimeInputs() {
    const countInput = document.getElementById('input-slot-count');
    const container = document.getElementById('dynamic-slots-container');
    if (!container) return;

    const count = parseInt(countInput?.value || 0);
    container.innerHTML = "";

    if (isNaN(count) || count < 1) return;
    if (count > 20) {
        customAlert("Số lượng ca chiếu trong ngày không nên vượt quá 20!", "Chú ý", "orange");
        countInput.value = 20;
        return;
    }

    let roomOptionsHtml = `<option value="" selected disabled>Chọn phòng</option>`;
    systemRooms.forEach(r => {
        const rName = r.tenPhong || r.name || `Phòng ${r.id}`;
        roomOptionsHtml += `<option value="${r.id}">${rName}</option>`;
    });

    let slotsHtml = "";
    for (let i = 1; i <= count; i++) {
        slotsHtml += `
            <div class="dynamic-slot-row mb-2">
                <div class="row align-items-center g-3">
                    <div class="col-auto">
                        <span class="badge bg-primary px-3 py-2">Ca thứ #${i}</span>
                    </div>
                    <div class="col-md-5 col-6">
                        <label class="form-label small fw-semibold text-secondary mb-1">Giờ bắt đầu</label>
                        <input type="time" class="form-control dynamic-start-time" required>
                    </div>
                    <div class="col-md-5 col-6">
                        <label class="form-label small fw-semibold text-secondary mb-1">Vị trí phòng chiếu</label>
                        <select class="form-select dynamic-room-select" required>
                            ${roomOptionsHtml}
                        </select>
                    </div>
                </div>
            </div>`;
    }
    container.innerHTML = slotsHtml;
}

// Tính giá ghế VIP xem trước
function calculateVipPricePreview() {
    const regPriceInput = document.getElementById('ticket-regular-price');
    const vipPercentInput = document.getElementById('ticket-vip-percent');
    const previewEl = document.getElementById('vip-price-preview');

    const regPrice = parseFloat(regPriceInput?.value || 0);
    const vipPercent = parseFloat(vipPercentInput?.value || 0);

    if (isNaN(regPrice) || regPrice <= 0) {
        if (previewEl) previewEl.innerHTML = `Dự kiến giá ghế VIP: <strong class="text-dark">0 VNĐ</strong>`;
        return;
    }

    const vipPrice = regPrice + (regPrice * (vipPercent / 100));
    if (previewEl) {
        previewEl.innerHTML = `Dự kiến giá ghế VIP: <strong class="text-dark">${vipPrice.toLocaleString('vi-VN')} VNĐ</strong>`;
    }
}

// Render Combo dưới dạng Card Checkbox chuẩn giao diện mẫu 1
function renderComboCheckboxesInShowtimeModal() {
    const container = document.getElementById('combo-checkbox-list');
    if (!container) return;

    if (!systemCombos || systemCombos.length === 0) {
        container.innerHTML = `<span class="text-muted small">Chưa có Combo nào trong hệ thống.</span>`;
        return;
    }

    let html = `<div class="scrollable-card-list">`;
    systemCombos.forEach(c => {
        const price = parseFloat(c.tongGia || c.giaCombo || c.comboPrice || c.price || c.totalPrice || 0);
        const name = c.tenCombo || c.comboName || c.name || 'Combo';
        const desc = c.mota || c.description || (c.items ? c.items.join(' + ') : 'Bắp + Nước');

        html += `
            <label class="selectable-card" for="cb-combo-${c.id}">
                <div class="d-flex align-items-center gap-3">
                    <input class="form-check-input combo-checkbox m-0" type="checkbox" value="${c.id}" id="cb-combo-${c.id}">
                    <div>
                        <div class="fw-bold text-dark">${name}</div>
                        <small class="text-muted d-block">${desc}</small>
                    </div>
                </div>
                <div class="card-price">${price.toLocaleString('vi-VN')}đ</div>
            </label>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

// Mở Modal Suất Chiếu
function onOpenShowtimeModal(editingId = null) {
    const form = document.getElementById('unifiedShowtimeForm');
    const modalTitle = document.getElementById('modalShowtimeTitle');
    const editingInput = document.getElementById('editing-showtime-id');

    if (form) form.reset();
    document.getElementById('dynamic-slots-container').innerHTML = "";
    toggleRepeatDateFields();
    calculateVipPricePreview();

    if (editingId) {
        if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square me-2"></i>Cập Nhật Suất Chiếu`;
        if (editingInput) editingInput.value = editingId;
        populateModalForEdit(editingId);
    } else {
        if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-calendar-plus me-2"></i>Thêm Suất Chiếu`;
        if (editingInput) editingInput.value = "";
    }
}


// Điền đầy đủ thông tin khi mở Modal Sửa Suất Chiếu
function populateModalForEdit(id) {
    const slot = showtimesDatabase.find(s => String(s.id) === String(id));
    if (!slot) return;

    const movieSelect = document.getElementById('add-select-movie');
    const singleDateInput = document.getElementById('add-single-date');
    const regPriceInput = document.getElementById('ticket-regular-price');
    const vipPercentInput = document.getElementById('ticket-vip-percent');
    const repeatSwitch = document.getElementById('repeat-switch');

    // Mặc định khi sửa 1 suất chiếu lẻ thì tắt công tắc lặp ngày
    if (repeatSwitch) {
        repeatSwitch.checked = false;
        toggleRepeatDateFields();
    }

    const mId = typeof slot.movie === 'object' ? slot.movie?.id : (slot.movieId || slot.movie);
    if (movieSelect) movieSelect.value = mId || "";

    const dateVal = slot.showDate || slot.date || "";
    if (singleDateInput) singleDateInput.value = dateVal;

    if (regPriceInput) regPriceInput.value = slot.regularPrice || "";
    if (vipPercentInput) vipPercentInput.value = slot.vipPercent || 20;

    onMovieSelectChange();
    calculateVipPricePreview();

    // Fill thông tin Ca chiếu & Phòng chiếu
    const container = document.getElementById('dynamic-slots-container');
    if (container) {
        let roomOptionsHtml = `<option value="" disabled>Chọn phòng</option>`;
        const currentRoomId = typeof slot.room === 'object' ? slot.room?.id : (slot.roomId || slot.room);

        systemRooms.forEach(r => {
            const rName = r.tenPhong || r.name || `Phòng ${r.id}`;
            const isSelected = String(r.id) === String(currentRoomId) ? 'selected' : '';
            roomOptionsHtml += `<option value="${r.id}" ${isSelected}>${rName}</option>`;
        });

        const startTimeVal = (slot.startTime || slot.time || '').substring(0, 5);

        container.innerHTML = `
            <div class="dynamic-slot-row">
                <div class="row align-items-center g-3">
                    <div class="col-auto">
                        <span class="badge bg-primary px-3 py-2">Ca chiếu</span>
                    </div>
                    <div class="col-md-5 col-6">
                        <label class="form-label small fw-semibold text-secondary mb-1">Giờ bắt đầu</label>
                        <input type="time" class="form-control dynamic-start-time" value="${startTimeVal}" required>
                    </div>
                    <div class="col-md-5 col-6">
                        <label class="form-label small fw-semibold text-secondary mb-1">Vị trí phòng chiếu</label>
                        <select class="form-select dynamic-room-select" required>
                            ${roomOptionsHtml}
                        </select>
                    </div>
                </div>
            </div>`;
    }

    // Tích chọn lại toàn bộ Combo đã được gán
    let activeComboIds = [];
    if (Array.isArray(slot.comboIds)) {
        activeComboIds = slot.comboIds;
    } else if (Array.isArray(slot.combos)) {
        activeComboIds = slot.combos.map(c => (typeof c === 'object' ? c.id : c));
    }

    document.querySelectorAll('.combo-checkbox').forEach(cb => {
        cb.checked = activeComboIds.some(cId => String(cId) === String(cb.value));
    });
}




// Lưu / Cập nhật Suất chiếu
async function saveUnifiedShowtime() {
    const editingId = document.getElementById('editing-showtime-id')?.value;
    const movieId = document.getElementById('add-select-movie')?.value;
    const isRepeat = document.getElementById('repeat-switch')?.checked;
    const singleDate = document.getElementById('add-single-date')?.value;
    const startDate = document.getElementById('add-start-date')?.value;
    const endDate = document.getElementById('add-end-date')?.value;
    const regularPrice = parseFloat(document.getElementById('ticket-regular-price')?.value);
    const vipPercent = parseFloat(document.getElementById('ticket-vip-percent')?.value);

    // 1. LẤY NGÀY & GIỜ HIỆN TẠI VÀ MỐC GIỜ GIỚI HẠN (+1 GIỜ)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Mốc thời gian giới hạn: Hiện tại + 1 tiếng
    const limitTime = new Date(now.getTime() + 60 * 60 * 1000);
    const limitHHMM = String(limitTime.getHours()).padStart(2, '0') + ':' + String(limitTime.getMinutes()).padStart(2, '0');

    // 2. VALIDATION DỮ LIỆU ĐẦU VÀO
    if (!movieId) return customAlert("Vui lòng chọn Phim áp dụng!", "Thiếu thông tin", "orange");

    if (isRepeat && !editingId) {
        if (!startDate || !endDate) return customAlert("Vui lòng chọn ngày bắt đầu và ngày kết thúc!", "Thiếu thông tin", "orange");

        if (startDate < todayStr) {
            return customAlert("Ngày bắt đầu lặp lịch chiếu phải từ <strong>Hôm nay</strong> trở đi!", "Lỗi ngày chiếu", "orange");
        }
        if (new Date(startDate) > new Date(endDate)) {
            return customAlert("Ngày kết thúc không được nhỏ hơn ngày bắt đầu!", "Lỗi ngày chiếu", "orange");
        }
    } else {
        if (!singleDate) return customAlert("Vui lòng chọn ngày áp dụng!", "Thiếu thông tin", "orange");

        if (singleDate < todayStr) {
            return customAlert("Không thể thiết lập suất chiếu cho ngày trong quá khứ!", "Lỗi ngày chiếu", "orange");
        }
    }

    if (isNaN(regularPrice) || regularPrice <= 0) return customAlert("Đơn giá vé thường không hợp lệ!", "Thiếu thông tin", "orange");

    // Lấy danh sách giờ chiếu & phòng chiếu
    const timeInputs = document.querySelectorAll('.dynamic-start-time');
    const roomSelects = document.querySelectorAll('.dynamic-room-select');

    const startTimes = [];
    let selectedRoomId = "";

    timeInputs.forEach((input, index) => {
        const timeVal = input.value;
        const roomVal = roomSelects[index]?.value;

        if (timeVal) {
            const formattedTime = timeVal.length === 5 ? timeVal + ":00" : timeVal;
            startTimes.push(formattedTime);
        }
        if (roomVal && !selectedRoomId) {
            selectedRoomId = String(roomVal);
        }
    });

    if (startTimes.length === 0) return customAlert("Vui lòng chọn ít nhất 1 khung giờ chiếu!", "Thiếu thông tin", "orange");
    if (!selectedRoomId) return customAlert("Vui lòng chọn phòng chiếu!", "Thiếu thông tin", "orange");

    // 3. BẮT LỖI GIỜ CHIẾU ĐƠN LẺ KHÔNG ĐỦ +1 GIỜ SO VỚI HIỆN TẠI (Khi chiếu trong hôm nay)
    if (!isRepeat && singleDate === todayStr) {
        for (let timeStr of startTimes) {
            const shortTime = timeStr.substring(0, 5);
            if (shortTime <= limitHHMM) {
                return customAlert(
                    `Giờ chiếu [<strong>${shortTime}</strong>] không hợp lệ! Thời gian chiếu hôm nay phải lớn hơn giờ hiện tại ít nhất 1 tiếng (sau <strong>${limitHHMM}</strong>).`,
                    "Thời gian không hợp lệ",
                    "orange"
                );
            }
        }
    }

    // 4. KIỂM TRA TRÙNG LỊCH CHIẾU VỚI CÁC SUẤT ĐÃ CÓ (CLIENT-SIDE)
    const parsedMovieId = !isNaN(movieId) ? Number(movieId) : movieId;
    const selectedMovie = systemMovies.find(m => String(m.id) === String(parsedMovieId));
    const duration = selectedMovie ? parseInt(selectedMovie.thoiLuong || selectedMovie.duration || 120) : 120;
    const targetCheckDate = (isRepeat && !editingId) ? startDate : singleDate;

    for (let timeStr of startTimes) {
        const [h, m] = timeStr.split(':').map(Number);
        const newStartMin = h * 60 + m;
        const newEndMin = newStartMin + duration;

        for (let existSlot of showtimesDatabase) {
            if (editingId && String(existSlot.id) === String(editingId)) continue;

            const existRoomId = typeof existSlot.room === 'object' ? existSlot.room?.id : (existSlot.roomId || existSlot.room);
            const existDate = existSlot.showDate || existSlot.date;

            if (String(existRoomId) === String(selectedRoomId) && existDate === targetCheckDate) {
                const existTime = existSlot.startTime || existSlot.time || "00:00";
                const [exH, exM] = existTime.split(':').map(Number);

                const existMovie = typeof existSlot.movie === 'object' ? existSlot.movie : systemMovies.find(m => String(m.id) === String(existSlot.movieId));
                const existDuration = existMovie ? parseInt(existMovie.thoiLuong || existMovie.duration || 120) : 120;

                const existStartMin = exH * 60 + exM;
                const existEndMin = existStartMin + existDuration;

                if (newStartMin < existEndMin && newEndMin > existStartMin) {
                    const formatMinToTime = (min) => {
                        const hh = Math.floor(min / 60).toString().padStart(2, '0');
                        const mm = (min % 60).toString().padStart(2, '0');
                        return `${hh}:${mm}`;
                    };

                    const existStartStr = formatMinToTime(existStartMin);
                    const existEndStr = formatMinToTime(existEndMin);
                    const existMovieTitle = existSlot.movieTitle || existMovie?.tenPhim || existMovie?.title || 'Phim khác';

                    return customAlert(
                        `Trùng lịch chiếu! Khung giờ bạn chọn (${timeStr.substring(0, 5)}) bị đè lên suất chiếu đã có sẵn từ <strong>${existStartStr} - ${existEndStr}</strong> (Phim: <em>${existMovieTitle}</em>).`,
                        "Trùng lịch chiếu",
                        "orange"
                    );
                }
            }
        }
    }

    // 5. CHUẨN BỊ PAYLOAD GỬI VỀ SERVER
    const selectedComboIds = Array.from(document.querySelectorAll('.combo-checkbox:checked')).map(cb => {
        return !isNaN(cb.value) ? Number(cb.value) : cb.value;
    });

    let payload = {};
    if (editingId) {
        payload = {
            movieId: parsedMovieId,
            roomId: String(selectedRoomId),
            showDate: singleDate,
            startTime: startTimes[0],
            regularPrice: Number(regularPrice),
            vipPercent: Number(vipPercent),
            comboIds: selectedComboIds
        };
    } else {
        payload = {
            movieId: parsedMovieId,
            roomId: String(selectedRoomId),
            startTimes: startTimes,
            isRepeat: Boolean(isRepeat),
            isConfirmSkipInvalid: false, // Mặc định là false
            singleDate: isRepeat ? (startDate || singleDate) : singleDate,
            startDate: isRepeat ? startDate : singleDate,
            endDate: isRepeat ? endDate : singleDate,
            regularPrice: Number(regularPrice),
            vipPercent: Number(vipPercent),
            comboIds: selectedComboIds
        };
    }

    const apiUrl = editingId ? `/api/showtimes/${editingId}` : '/api/showtimes';
    const apiMethod = editingId ? 'PUT' : 'POST';

    // 6. THỰC THI GỬI API VÀ XỬ LÝ PHẢN HỒI
    async function executeSubmit(requestPayload) {
        try {
            const response = await fetch(apiUrl, {
                method: apiMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            let result = {};
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            }

            if (response.ok && (result.success || result.id)) {
                customAlert(editingId ? "Cập nhật suất chiếu thành công!" : "Tạo mới suất chiếu thành công!", "Thành công", "success");

                const modalEl = document.getElementById('unifiedShowtimeModal');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }

                if (editingId) {
                    updateShowtimeCard(result.data || result);
                } else {
                    fetchShowtimes();
                }
            } else {
                const serverMsg = result.message || "Dữ liệu chưa khớp với yêu cầu của máy chủ.";


                // Gọi Confirm tạo suất chiếu khi bị lỗi thời gian trong chuỗi lặp
                if (serverMsg.includes("REQUIRE_CONFIRM")) {
                    const cleanMsg = serverMsg.replace(" | REQUIRE_CONFIRM", "");

                    customConfirm(
                        cleanMsg,
                        async () => {
                            requestPayload.isConfirmSkipInvalid = true;
                            await executeSubmit(requestPayload);
                        },
                        "Xác nhận tạo suất chiếu",
                        "warning",
                        "Đồng ý tạo"
                    );
                } else {
                    customAlert(`Lỗi máy chủ (${response.status}): ${serverMsg}`, "Thất bại", "danger");
                }
            }
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
            customAlert("Đã xảy ra lỗi kết nối với máy chủ API!", "Lỗi mạng", "danger");
        }
    }

    // Thực thi gọi hàm gửi API
    await executeSubmit(payload);
}

function formatTimeToAMPM(timeStr) {
    if (!timeStr) return "";


    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parts[1].substring(0, 2) : "00";

    if (isNaN(hours)) return timeStr;


    const ampm = hours >= 12 ? 'PM' : 'AM';


    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours < 10 ? '0' + hours : hours;

    return `${formattedHours}:${minutes} ${ampm}`;
}
// Hàm kiểm tra suất chiếu đã kết thúc hay chưa
function isShowtimeCompleted(slot) {
    const now = new Date();
    const dateStr = slot.showDate || slot.date; // YYYY-MM-DD
    if (!dateStr) return false;

    // Tính giờ kết thúc: Ưu tiên slot.endTime, nếu không có thì cộng thời lượng phim vào slot.startTime
    let endTimeStr = slot.endTime;
    if (!endTimeStr) {
        const startTimeStr = slot.startTime || slot.time || "00:00";
        const [h, m] = startTimeStr.split(':').map(Number);
        const duration = (typeof slot.movie === 'object' && slot.movie?.duration) || slot.duration || 120;

        const totalMinutes = h * 60 + m + parseInt(duration);
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
    }

    // Tạo object Date thời điểm kết thúc suất chiếu
    const showEndDateTime = new Date(`${dateStr}T${endTimeStr.substring(0, 5)}:00`);
    return showEndDateTime < now;
}


// Hàm chuyển hướng sang trang chi tiết suất chiếu
function goToShowtimeDetail(showtimeId) {
    if (!showtimeId) return;
    window.location.href = `/showtimedetail?id=${showtimeId}`;
}

function renderShowtimeCards() {
    const container = document.getElementById('cards-display-container');
    const filterValue = document.getElementById('statusFilter')?.value || 'ALL';
    const dateFilterValue = document.getElementById('dateFilter')?.value;

    if (!container) return;
    container.innerHTML = "";

    // 1. LỌC DANH SÁCH THEO NGÀY & TRẠNG THÁI
    const filteredList = showtimesDatabase.filter(slot => {
        const slotDate = slot.showDate || slot.date;
        if (dateFilterValue && slotDate !== dateFilterValue) return false;

        const isCompleted = isShowtimeCompleted(slot);
        const isHidden = Boolean(slot.isHidden) || slot.status === 'HIDDEN';

        if (filterValue === 'ASSIGNED') return !isCompleted && !isHidden;
        if (filterValue === 'HIDDEN') return isHidden;
        if (filterValue === 'COMPLETED') return isCompleted && !isHidden;

        return true;
    });

    // 2. SẮP XẾP SUẤT CHIẾU THEO GIỜ CHIẾU
    filteredList.sort((a, b) => {
        const timeA = a.startTime || a.time || "00:00";
        const timeB = b.startTime || b.time || "00:00";
        return timeA.localeCompare(timeB);
    });

    // 3. XỬ LÝ KHÔNG CÓ DỮ LIỆU
    if (!filteredList || filteredList.length === 0) {
        const dateFormatted = dateFilterValue ? formatDate(dateFilterValue) : '';
        container.innerHTML = `
            <div class="col-12 p-5 text-center text-muted bg-white rounded-4 border shadow-sm">
                <i class="fa-regular fa-calendar-xmark fs-1 mb-2 text-secondary"></i>
                <p class="mb-0 fw-semibold">Không tìm thấy suất chiếu nào phù hợp${dateFormatted ? ' cho ngày ' + dateFormatted : ''}.</p>
            </div>`;
        return;
    }

    // 4. RENDER DANH SÁCH CARD SUẤT CHIẾU
    filteredList.forEach(slot => {
        const isCompleted = isShowtimeCompleted(slot);
        const isHidden = Boolean(slot.isHidden) || slot.status === 'HIDDEN';

        // Thông tin Phim
        const movieName = slot.movie?.title || slot.movie?.tenPhim || slot.movieTitle || "Phim chưa đặt tên";
        const durationDisplay = slot.movie?.duration || slot.movie?.thoiLuong || slot.duration || 0;
        const posterUrl = slot.movie?.posterUrl || slot.movie?.hinhAnh || slot.posterUrl || '';

        // Thông tin Phòng chiếu
        const roomName = slot.room?.tenPhong || slot.roomName || "Phòng chiếu";

        // TÍNH TỔNG SỐ GHẾ (Lấy từ soLuongGheThuong + soLuongGheVip trong CSDL)
        const gheThuong = Number(slot.room?.soLuongGheThuong || 0);
        const gheVip = Number(slot.room?.soLuongGheVip || 0);
        const totalSeats = (gheThuong + gheVip) || slot.totalSeats || slot.room?.tongSoGhe || 18;

        // ĐẾM SỐ VÉ ĐÃ BÁN (Lấy từ ticketsSold / soVeDaBan từ Backend)
        let ticketsSold = 0;
        if (typeof slot.ticketsSold === 'number') ticketsSold = slot.ticketsSold;
        else if (typeof slot.soVeDaBan === 'number') ticketsSold = slot.soVeDaBan;
        else if (Array.isArray(slot.tickets)) ticketsSold = slot.tickets.length;

        // Combo Badges
        let comboBadgesHtml = "";
        if (Array.isArray(slot.combos)) {
            slot.combos.forEach(c => {
                comboBadgesHtml += `<span class="badge-combo-tag">${c.tenCombo || c.name}</span> `;
            });
        }

        // Giá vé & Thời gian
        const regPrice = slot.regularPrice ? slot.regularPrice.toLocaleString('vi-VN') : '0';
        const vipPercent = slot.vipPercent || 0;

        const rawTime = slot.startTime || slot.time || "00:00";
        const timeDisplay = formatTimeToAMPM(rawTime);
        const dateDisplay = formatDate(slot.showDate || slot.date || "2026-08-06");

        // Badge Trạng thái
        let statusBadgeHtml = `<span class="badge bg-success px-2.5 py-1.5 fs-7"><i class="fa-solid fa-circle-check me-1"></i>Đã thiết lập vé</span>`;
        let cardExtraClass = "";

        if (isHidden) {
            statusBadgeHtml = `<span class="badge bg-secondary px-2.5 py-1.5 fs-7"><i class="fa-solid fa-eye-slash me-1"></i>Đã ẩn</span>`;
            cardExtraClass = "hidden-card";
        } else if (isCompleted) {
            statusBadgeHtml = `<span class="badge bg-dark px-2.5 py-1.5 fs-7"><i class="fa-solid fa-clock-rotate-left me-1"></i>Đã chiếu xong</span>`;
            cardExtraClass = "opacity-75 bg-light";
        }

        const cardHTML = `
            <div class="col-12 mb-3" id="showtime-card-${slot.id}">
                <div class="showtime-card-v2 ${cardExtraClass} p-3"
                     style="cursor: pointer;"
                     onclick="goToShowtimeDetail('${slot.id}')">
                    <div class="row align-items-center g-3">

                        <!-- KHUNG POSTER -->
                        <div class="col-auto">
                            <div class="poster-container shadow-sm rounded-3 overflow-hidden bg-light d-flex align-items-center justify-content-center" style="width: 80px; height: 110px;">
                                ${posterUrl ?
                                    `<img src="${posterUrl}" class="w-100 h-100" style="object-fit: cover;" alt="${movieName}">` :
                                    `<i class="fa-solid fa-film fs-2 text-secondary"></i>`
                                }
                            </div>
                        </div>

                        <!-- CỘT THỜI GIAN -->
                        <div class="col-md-2 text-center text-md-start border-end pe-md-3">
                            <span class="badge ${isCompleted ? 'bg-secondary' : 'bg-primary'} fs-6 px-3 py-1.5 rounded-3 mb-2 d-inline-block shadow-sm">${timeDisplay}</span>
                            <div class="small text-muted fw-semibold mb-1"><i class="fa-regular fa-calendar me-1"></i>${dateDisplay}</div>
                            <div class="small text-muted"><i class="fa-regular fa-clock me-1"></i>${durationDisplay} phút</div>
                        </div>

                        <!-- CỘT THÔNG TIN CHÍNH -->
                        <div class="col-md-5 col-lg-6 ps-md-3">
                            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
                                ${statusBadgeHtml}
                                ${comboBadgesHtml}
                            </div>

                            <h4 class="fw-bold text-dark mb-1.5 text-truncate">${movieName}</h4>

                            <div class="text-secondary fw-semibold small mb-1">
                                <i class="fa-solid fa-door-open text-muted me-1"></i>Vị trí phòng: <strong>${roomName}</strong>
                            </div>

                            <!-- HIỂN THỊ ĐỘNG SỐ VÉ ĐÃ BÁN / TỔNG SỐ GHẾ PHÒNG -->
                            <div class="ticket-status-text mb-1">
                                <i class="fa-solid fa-ticket me-1 text-primary"></i>Tình trạng vé:
                                <strong class="${ticketsSold > 0 ? 'text-primary' : 'text-dark'}">${ticketsSold}/${totalSeats}</strong> ghế
                            </div>

                            <div class="small text-muted">
                                Giá thường: <strong class="text-dark">${regPrice}đ</strong> · VIP: +${vipPercent}%
                            </div>
                        </div>

                        <!-- CỘT NÚT THAO TÁC -->
                        <div class="col-md-3 col-lg-3 text-md-end d-flex gap-2 justify-content-md-end align-items-center ms-auto" onclick="event.stopPropagation();">
                            <button class="btn btn-light text-secondary border btn-sm px-3 fw-semibold" onclick="event.stopPropagation(); toggleHideShowtime('${slot.id}')">
                                <i class="fa-solid ${isHidden ? 'fa-eye' : 'fa-eye-slash'} me-1"></i>${isHidden ? 'Hiện' : 'Ẩn'}
                            </button>
                            <button class="btn btn-outline-primary btn-sm px-3 fw-semibold" ${isCompleted ? 'disabled' : ''} data-bs-toggle="modal" data-bs-target="#unifiedShowtimeModal" onclick="event.stopPropagation(); onOpenShowtimeModal('${slot.id}')">
                                <i class="fa-solid fa-pen-to-square me-1"></i>Sửa
                            </button>
                            <button class="btn btn-outline-danger btn-sm px-3 fw-semibold" onclick="event.stopPropagation(); deleteShowtime('${slot.id}')">
                                <i class="fa-solid fa-trash me-1"></i>Xóa
                            </button>
                        </div>

                    </div>
                </div>
            </div>`;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Bật/Tắt Ẩn Suất Chiếu
async function toggleHideShowtime(id) {
    const slot = showtimesDatabase.find(s => String(s.id) === String(id));
    if (!slot) return;

    const actionText = slot.isHidden ? "hiển thị lại" : "ẩn";
    customConfirm(`Bạn có chắc chắn muốn ${actionText} suất chiếu này?`, async () => {
        try {
            const response = await fetch(`/api/showtimes/${id}/toggle-hide`, { method: 'PATCH' });
            if (response.ok) {
                slot.isHidden = !slot.isHidden;
                renderShowtimeCards();
                customAlert(`Đã ${actionText} suất chiếu!`, "Thành công", "success");
            } else {
                slot.isHidden = !slot.isHidden;
                renderShowtimeCards();
            }
        } catch (e) {
            slot.isHidden = !slot.isHidden;
            renderShowtimeCards();
        }
    }, "Xác nhận ẩn/hiện");
}

// Xóa suất chiếu
function deleteShowtime(id) {
    customConfirm(
        `Bạn có chắc chắn muốn xóa suất chiếu không?`,
        async () => {
            try {
                const response = await fetch(`/api/showtimes/${id}`, { method: 'DELETE' });
                let result = {};

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    result = await response.json();
                }

                if (response.ok) {
                    customAlert('Xóa suất chiếu thành công!', 'Thành công', 'success');
                    fetchShowtimes();
                } else {
                    customAlert(result.message || 'Không thể xóa suất chiếu.', 'Lỗi', 'danger');
                }
            } catch (error) {
                console.error("Lỗi xóa suất chiếu:", error);
                customAlert("Đã xảy ra lỗi kết nối với máy chủ!", "Lỗi", "danger");
            }
        },
        "Xác nhận xóa",
        "danger",
        "Xóa ngay"
    );
}
// Hàm cập nhật trực tiếp 1 Card Suất chiếu trên giao diện
function updateShowtimeCard(slot) {
    const cardElement = document.getElementById(`showtime-card-${slot.id}`);
    if (!cardElement) return;


    const index = showtimesDatabase.findIndex(s => String(s.id) === String(slot.id));
    if (index !== -1) {
        showtimesDatabase[index] = { ...showtimesDatabase[index], ...slot };
    }


    let movieName = "Phim chưa đặt tên";
    let durationDisplay = slot.duration || 0;
    let posterUrl = slot.posterUrl || slot.moviePoster || '';

    if (typeof slot.movie === 'object' && slot.movie !== null) {
        movieName = slot.movie.tenPhim || slot.movie.title || slot.movie.name || movieName;
        durationDisplay = slot.movie.thoiLuong || slot.movie.duration || durationDisplay;
        posterUrl = posterUrl || slot.movie.hinhAnh || slot.movie.posterUrl || slot.movie.poster || slot.movie.image || slot.movie.imageUrl || '';
    } else if (typeof slot.movieTitle === 'string') {
        movieName = slot.movieTitle;
    }


    let roomName = "Phòng chiếu";
    if (typeof slot.room === 'object' && slot.room !== null) {
        roomName = slot.room.tenPhong || slot.room.name || roomName;
    } else if (typeof slot.roomName === 'string') {
        roomName = slot.roomName;
    }

    let rawTime = slot.startTime || slot.time || "00:00";
    const timeDisplay = formatTimeToAMPM(rawTime);
    const dateDisplay = formatDate(slot.showDate || slot.date || "2026-07-25");


    const regPrice = slot.regularPrice ? slot.regularPrice.toLocaleString('vi-VN') : '0';
    const vipPercent = slot.vipPercent || 20;


    const badgeTime = cardElement.querySelector('.badge.bg-primary');
    if (badgeTime) badgeTime.textContent = timeDisplay;

    const dateEl = cardElement.querySelector('.fa-calendar')?.parentElement;
    if (dateEl) dateEl.innerHTML = `<i class="fa-regular fa-calendar me-1"></i>${dateDisplay}`;

    const titleEl = cardElement.querySelector('h4.fw-bold');
    if (titleEl) titleEl.textContent = movieName;

    const roomEl = cardElement.querySelector('.fa-door-open')?.parentElement;
    if (roomEl) roomEl.innerHTML = `<i class="fa-solid fa-door-open text-muted me-1"></i>Vị trí phòng chiếu: <strong>${roomName}</strong>`;

    const priceEl = cardElement.querySelector('.small.text-muted:last-child');
    if (priceEl) priceEl.innerHTML = `Giá thường: <strong class="text-dark">${regPrice}đ</strong> · VIP: +${vipPercent}%`;


    const imgEl = cardElement.querySelector('.poster-container img');
    if (imgEl && posterUrl) imgEl.src = posterUrl;
}

// Mở Modal Cấu Hình Combo
function openComboModal() {
    fetchProducts();
    fetchCombos();
}

// Toggle Thêm Bắp / Nước
function toggleAddProductForm() {
    const form = document.getElementById('add-product-form');
    if (form) form.classList.toggle('d-none');
}

// Thêm Bắp/Nước mới
async function addNewProduct() {
    const type = document.getElementById('new-product-type')?.value;
    const name = document.getElementById('new-product-name')?.value?.trim();
    const costPrice = parseFloat(document.getElementById('new-product-cost')?.value);
    const sellingPrice = parseFloat(document.getElementById('new-product-sell')?.value);

    if (!name) return customAlert("Vui lòng nhập tên sản phẩm!", "Thiếu thông tin", "orange");
    if (isNaN(costPrice) || costPrice < 0) return customAlert("Giá nhập không hợp lệ!", "Lỗi", "orange");
    if (isNaN(sellingPrice) || sellingPrice < 0) return customAlert("Giá bán không hợp lệ!", "Lỗi", "orange");

    const payload = { type, name, costPrice, sellPrice: sellingPrice };

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok && (result.success || result.id)) {
            customAlert("Thêm sản phẩm thành công!", "Thành công", "success");
            document.getElementById('new-product-name').value = "";
            document.getElementById('new-product-cost').value = "";
            document.getElementById('new-product-sell').value = "";
            toggleAddProductForm();
            fetchProducts();
        } else {
            customAlert(result.message || "Không thể thêm sản phẩm.", "Lỗi", "danger");
        }
    } catch (error) {
        console.error("Lỗi thêm sản phẩm:", error);
        customAlert("Lỗi kết nối máy chủ!", "Lỗi", "danger");
    }
}

// Render Danh sách Nước dạng Card Checkbox chuẩn giao diện mẫu 2 (image_0adac1.png)
function renderProductsInComboForm() {
    const popcornSelect = document.getElementById('combo-popcorn-select');
    const drinkChecklist = document.getElementById('drink-checklist');

    if (popcornSelect) {
        let popcornHtml = `<option value="" selected disabled>-- Chọn loại bắp --</option>`;
        const popcorns = systemProducts.filter(p => p.type === 'POPCORN');
        popcorns.forEach(p => {
            const price = parseFloat(p.sellPrice || p.sellingPrice || p.giaBan || 0);
            popcornHtml += `<option value="${p.id}" data-price="${price}">${p.name} (${price.toLocaleString('vi-VN')}đ)</option>`;
        });
        popcornSelect.innerHTML = popcornHtml;
    }

    if (drinkChecklist) {
        let drinkHtml = "";
        const drinks = systemProducts.filter(p => p.type === 'DRINK');
        if (drinks.length === 0) {
            drinkHtml = `<span class="text-muted small">Chưa có sản phẩm Nước nào.</span>`;
        } else {
            drinkHtml = `<div class="scrollable-card-list">`;
            drinks.forEach(d => {
                const price = parseFloat(d.sellPrice || d.sellingPrice || d.giaBan || 0);
                drinkHtml += `
                    <label class="selectable-card" for="chk-drink-${d.id}">
                        <div class="d-flex align-items-center gap-2">
                            <input class="form-check-input combo-drink-cb m-0" type="checkbox" value="${d.id}" data-price="${price}" id="chk-drink-${d.id}" onchange="autoCalculateComboPrice()">
                            <span class="fw-semibold text-dark">${d.name}</span>
                        </div>
                        <span class="card-price">${price.toLocaleString('vi-VN')}đ</span>
                    </label>`;
            });
            drinkHtml += `</div>`;
        }
        drinkChecklist.innerHTML = drinkHtml;
    }
}

// Tự động tính tổng giá Combo
function autoCalculateComboPrice() {
    const popcornSelect = document.getElementById('combo-popcorn-select');
    const comboPriceInput = document.getElementById('new-combo-price');

    let popcornPrice = 0;
    if (popcornSelect && popcornSelect.selectedIndex > 0) {
        const selectedOption = popcornSelect.options[popcornSelect.selectedIndex];
        popcornPrice = parseFloat(selectedOption.getAttribute('data-price') || 0);
    }

    let maxDrinkPrice = 0;
    document.querySelectorAll('.combo-drink-cb:checked').forEach(cb => {
        const price = parseFloat(cb.getAttribute('data-price') || 0);
        if (price > maxDrinkPrice) maxDrinkPrice = price;
    });

    const totalPrice = popcornPrice + maxDrinkPrice;
    if (comboPriceInput) comboPriceInput.value = totalPrice > 0 ? totalPrice : '';
}

// Tạo Combo mới
async function addNewCombo() {
    const comboName = document.getElementById('new-combo-name')?.value?.trim();
    const popcornId = document.getElementById('combo-popcorn-select')?.value;
    const comboPrice = parseFloat(document.getElementById('new-combo-price')?.value || 0);
    const drinkIds = Array.from(document.querySelectorAll('.combo-drink-cb:checked')).map(cb => cb.value);

    if (!comboName) return customAlert("Vui lòng nhập tên Combo!", "Thiếu thông tin", "orange");
    if (!popcornId) return customAlert("Vui lòng chọn 1 loại Bắp!", "Thiếu thông tin", "orange");
    if (drinkIds.length === 0) return customAlert("Vui lòng chọn ít nhất 1 loại Nước!", "Thiếu thông tin", "orange");

    const payload = {
        name: comboName,
        popcornId: popcornId,
        drinkIds: drinkIds,
        comboPrice: comboPrice,
        tongGia: comboPrice
    };

    try {
        const response = await fetch('/api/combos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok && (result.success || result.id)) {
            customAlert("Tạo Combo thành công!", "Thành công", "success");
            document.getElementById('new-combo-name').value = "";
            document.getElementById('combo-popcorn-select').value = "";
            document.querySelectorAll('.combo-drink-cb').forEach(cb => cb.checked = false);
            autoCalculateComboPrice();
            fetchCombos();
        } else {
            customAlert(result.message || "Không thể tạo Combo.", "Lỗi", "danger");
        }
    } catch (error) {
        console.error("Lỗi thêm Combo:", error);
        customAlert("Lỗi kết nối máy chủ!", "Lỗi", "danger");
    }
}

// Render Danh sách Combo đã cấu hình
function renderComboList() {
    const container = document.getElementById('combo-list-container');
    const badge = document.getElementById('combo-count-badge');
    if (!container) return;

    if (badge) badge.innerText = systemCombos.length;
    container.innerHTML = "";

    if (!systemCombos || systemCombos.length === 0) {
        container.innerHTML = `<div class="p-3 text-center text-muted bg-light rounded-3 border">Chưa có Combo nào được cấu hình.</div>`;
        return;
    }

    systemCombos.forEach(c => {
        // Fix Sửa lỗi lấy Giá Combo từ thuộc tính CSDL
        const priceNum = parseFloat(c.tongGia || c.giaCombo || c.comboPrice || c.price || c.totalPrice || 0);
        const priceText = `${priceNum.toLocaleString('vi-VN')}đ`;

        const cardHtml = `
            <div class="combo-item shadow-sm mb-2">
                <div class="combo-info">
                    <h6><i class="fa-solid fa-box-open text-warning me-2"></i>${c.tenCombo || c.comboName || c.name}</h6>
                    <div class="combo-meta">${c.mota || c.description || 'Combo Bắp + Nước'}</div>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span class="combo-price text-warning fw-bold fs-6">${priceText}</span>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteCombo('${c.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Xóa Combo
function deleteCombo(id) {
    customConfirm(`Bạn có chắc chắn muốn xóa Combo mã [${id}] không?`, async () => {
        try {
            const response = await fetch(`/api/combos/${id}`, { method: 'DELETE' });
            const result = await response.json();

            if (response.ok && result.success) {
                customAlert("Xóa Combo thành công!", "Thành công", "success");
                fetchCombos();
            } else {
                customAlert(result.message || "Không thể xóa Combo.", "Lỗi", "danger");
            }
        } catch (error) {
            console.error("Lỗi xóa Combo:", error);
            customAlert("Lỗi kết nối máy chủ!", "Lỗi", "danger");
        }
    });
}

// Format ngày tháng DD/MM/YYYY
function formatDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}