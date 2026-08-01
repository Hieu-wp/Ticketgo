// ==========================================
// BỘ NHỚ TẠM DỮ LIỆU TỪ DATABASE
// ==========================================
let showtimesDatabase = [];
let systemMovies = [];
let systemRooms = [];

// Khởi tạo ứng dụng khi load trang
document.addEventListener("DOMContentLoaded", () => {
    fetchMovies();
    fetchRooms();
    fetchShowtimes();
});

// ==========================================
// 1. TẢI DỮ LIỆU TỪ API
// ==========================================

// Tải danh sách phim
async function fetchMovies() {
    try {
        const response = await fetch('/api/movies');
        const result = await response.json();
        if (result.success) {
            systemMovies = result.data;
            populateMovieDropdowns();
        }
    } catch (error) {
        console.error("Lỗi tải danh sách phim:", error);
    }
}

// Tải danh sách phòng chiếu
async function fetchRooms() {
    try {
        const response = await fetch('/api/rooms');
        const result = await response.json();
        if (result.success) {
            systemRooms = result.data;
        }
    } catch (error) {
        console.error("Lỗi tải danh sách phòng:", error);
    }
}

// Tải danh sách tất cả suất chiếu
async function fetchShowtimes() {
    try {
        const response = await fetch('/api/showtimes');
        const result = await response.json();
        if (result.success) {
            showtimesDatabase = result.data;
            renderShowtimeCards();
        }
    } catch (error) {
        console.error("Lỗi tải danh sách suất chiếu:", error);
    }
}

// ==========================================
// 2. XỬ LÝ GIAO DIỆN PHIM VÀ PHÒNG
// ==========================================

// Đổ danh sách phim vào Dropdown
function populateMovieDropdowns() {
    const addMovieSelect = document.getElementById('add-select-movie');
    const ticketMovieSelect = document.getElementById('ticket-select-movie');

    let optionsHtml = '<option value="">-- Chọn phim áp dụng --</option>';

    systemMovies.forEach(m => {
        optionsHtml += `<option value="${m.id}">${m.tenFilm}</option>`;
    });

    if (addMovieSelect) addMovieSelect.innerHTML = optionsHtml;
    if (ticketMovieSelect) ticketMovieSelect.innerHTML = optionsHtml;
}

// Tự động điền thời lượng phim khi chọn phim
function onMovieSelected() {
    const selectedMovieId = document.getElementById('add-select-movie').value;
    const movie = systemMovies.find(m => String(m.id) === String(selectedMovieId));

    if (movie) {
        document.getElementById('add-duration').value = movie.thoiLuong || '';
    } else {
        document.getElementById('add-duration').value = '';
    }
}

// Hàm hỗ trợ tìm thông tin phòng theo ID
function getRoomById(roomId) {
    if (!roomId) return null;
    const room = systemRooms.find(r => String(r.id) === String(roomId));
    if (room) {
        return {
            id: room.id,
            tenPhong: room.tenPhong,
            tongSoGhe: room.tongSoGhe
        };
    }
    return null;
}

// Ẩn/Hiện ô nhập ngày lặp lại
function toggleRepeatDateFields() {
    const isRepeat = document.getElementById('repeat-switch').checked;
    if (isRepeat) {
        document.getElementById('single-date-box').classList.add('d-none');
        document.getElementById('range-date-box').classList.remove('d-none');
    } else {
        document.getElementById('single-date-box').classList.remove('d-none');
        document.getElementById('range-date-box').classList.add('d-none');
    }
}

// Tạo giao diện nhập từng ca chiếu động (Sửa lại thuộc tính tenPhong và tongSoGhe)
function generateShowtimeInputs() {
    const count = parseInt(document.getElementById('input-slot-count').value);
    const container = document.getElementById('dynamic-slots-container');
    container.innerHTML = "";

    if (!count || count < 1) return;

    let roomOptions = `<option value="" selected disabled>-- Chọn phòng --</option>`;
    systemRooms.forEach(r => {
        roomOptions += `<option value="${r.id}">${r.tenPhong} (${r.tongSoGhe} ghế)</option>`;
    });

    for (let i = 1; i <= count; i++) {
        const slotRow = document.createElement('div');
        slotRow.className = "dynamic-slot-row mb-3";
        slotRow.innerHTML = `
            <div class="row align-items-center g-3">
                <div class="col-md-2"><span class="badge bg-primary w-100 py-2">Ca thứ #${i}</span></div>
                <div class="col-md-5">
                    <label class="form-label small fw-bold text-secondary mb-1">Giờ bắt đầu</label>
                    <input type="time" name="gioBatDau" class="form-control dynamic-time" required>
                </div>
                <div class="col-md-5">
                    <label class="form-label small fw-bold text-secondary mb-1">Vị trí phòng chiếu</label>
                    <select name="phongId" class="form-select py-2 dynamic-room" required>
                        ${roomOptions}
                    </select>
                </div>
            </div>`;
        container.appendChild(slotRow);
    }
}

// ==========================================
// 3. THÊM / SỬA / XÓA LỊCH CHIẾU
// ==========================================

// Lưu lịch chiếu mới
async function saveAddShowtime() {
    const movieId = document.getElementById('add-select-movie').value;
    const isRepeat = document.getElementById('repeat-switch').checked;
    const singleDate = document.getElementById('add-single-date').value;
    const startDate = document.getElementById('add-start-date').value;
    const endDate = document.getElementById('add-end-date').value;
    const slotCount = parseInt(document.getElementById('input-slot-count').value);

    const timeInputs = document.querySelectorAll('.dynamic-time');
    const roomSelects = document.querySelectorAll('.dynamic-room');

    let slots = [];
    for (let i = 0; i < timeInputs.length; i++) {
        if (timeInputs[i].value && roomSelects[i].value) {
            slots.push({
                phongId: roomSelects[i].value,
                gioBatDau: timeInputs[i].value + ":00"
            });
        }
    }

    const payload = {
        phimId: movieId,
        lapLaiHangNgay: isRepeat,
        singleDate: isRepeat ? null : singleDate,
        ngayBatDau: isRepeat ? startDate : singleDate,
        ngayKetThuc: isRepeat ? endDate : singleDate,
        soSuatTrongNgay: slotCount || slots.length,
        slots: slots
    };

    try {
        const response = await fetch('/api/showtimes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message || 'Thêm lịch chiếu thành công!');
            const modalEl = document.getElementById('addShowtimeModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
            document.getElementById('addShowtimeForm').reset();
            document.getElementById('dynamic-slots-container').innerHTML = "";
            fetchShowtimes();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể tạo lịch chiếu.'));
        }
    } catch (error) {
        console.error("Lỗi khi kết nối máy chủ:", error);
        alert("Đã xảy ra lỗi kết nối với máy chủ!");
    }
}

// Render Card Suất chiếu ngoài giao diện
// Render danh sách Card Suất Chiếu với logic kiểm tra trạng thái
function renderShowtimeCards() {
    const container = document.getElementById('cards-display-container');
    if (!container) return;

    container.innerHTML = "";

    if (!showtimesDatabase || showtimesDatabase.length === 0) {
        container.innerHTML = `<div class="col-12 p-5 text-center text-muted bg-white rounded-4 border">Không có dữ liệu suất chiếu nào.</div>`;
        return;
    }

    showtimesDatabase.forEach(slot => {
        let statusBadge = "";
        let detailsContentHtml = "";

        // =========================================================
        // KIỂM TRA: NẾU ĐÃ CÓ DỮ LIỆU CẤU HÌNH VÉ (isAssigned == true)
        // =========================================================
        if (slot.isAssigned) {
            const ticketsSold = slot.ticketsSold || 0;
            const totalSeats = slot.totalSeats || 0;

            // Badge xanh báo đã thiết lập
            statusBadge = `<span class="badge bg-success px-2.5 py-1.5"><i class="fa-solid fa-circle-check me-1"></i>Đã thiết lập vé</span>`;

            // Định dạng hiển thị giá vé
            const regularPriceText = slot.regularPrice ? `${slot.regularPrice.toLocaleString('vi-VN')} VNĐ` : '---';
            const vipPriceText = slot.vipPrice ? `${slot.vipPrice.toLocaleString('vi-VN')} VNĐ` : '---';

            // Khung hiển thị tình trạng vé và Giá vé
            let ticketCountBadge = (totalSeats > 0 && ticketsSold >= totalSeats)
                ? `<span class="badge bg-danger">ĐÃ BÁN HẾT VÉ (${ticketsSold}/${totalSeats})</span>`
                : `<span class="text-primary small fw-bold"><i class="fa-solid fa-ticket me-1"></i>Tình trạng vé: ${ticketsSold}/${totalSeats} ghế</span>`;

            detailsContentHtml = `
                <div class="mt-1">${ticketCountBadge}</div>
                <div class="small text-secondary mt-1">
                    <i class="fa-solid fa-tags me-1"></i>Giá vé:
                    Thường: <strong class="text-dark">${regularPriceText}</strong> |
                    VIP: <strong class="text-dark">${vipPriceText}</strong>
                </div>`;
        }
        // =========================================================
        // KIỂM TRA: NẾU CHƯA CÓ DỮ LIỆU (VẪN ĐANG TRỐNG)
        // =========================================================
        else {
            // Badge vàng cảnh báo đang trống
            statusBadge = `<span class="badge bg-warning text-dark px-2.5 py-1.5"><i class="fa-solid fa-triangle-exclamation me-1"></i>Suất chiếu còn trống</span>`;

            // Dòng chữ đỏ báo chưa kích hoạt
            detailsContentHtml = `
                <div class="mt-1">
                    <span class="text-danger small fw-semibold"><i class="fa-solid fa-circle-xmark me-1"></i>Chưa kích hoạt bán vé</span>
                </div>
                <div class="small text-muted mt-1">
                    <i class="fa-solid fa-circle-info me-1"></i>Vui lòng nhấn nút <strong>"Phát hành vé"</strong> để thiết lập giá.
                </div>`;
        }

        // Tạo khung HTML Card
        const cardHTML = `
            <div class="col-12 mb-3">
                <div class="card showtime-card border shadow-sm rounded-3">
                    <div class="card-body p-3">
                        <div class="row align-items-center g-3">
                            <!-- Icon / Poster -->
                            <div class="col-auto">
                                <div class="poster-container shadow-sm bg-light rounded-3 d-flex align-items-center justify-content-center" style="width: 65px; height: 85px;">
                                    <i class="fa-solid fa-film fs-2 text-secondary"></i>
                                </div>
                            </div>

                            <!-- Thời gian & Ngày chiếu -->
                            <div class="col-md-2 text-center text-md-start">
                                <span class="badge bg-primary fs-5 py-2 px-3 shadow-sm">${slot.time || "00:00"}</span>
                                <small class="text-muted d-block mt-2"><i class="fa-regular fa-calendar me-1"></i>${formatDate(slot.date)}</small>
                                <small class="text-muted d-block"><i class="fa-regular fa-clock me-1"></i>${slot.duration || 0} phút</small>
                            </div>

                            <!-- Chi tiết Phim, Trạng thái & Giá vé -->
                            <div class="col-md-6">
                                <div class="mb-1.5">${statusBadge}</div>
                                <h5 class="fw-bold text-dark mb-1 mt-1">${slot.movie || "[ Chưa gán tên phim ]"}</h5>
                                <p class="text-muted small mb-0"><i class="fa-solid fa-door-open me-1"></i>Vị trí: <strong>${slot.room || "Chưa chọn"}</strong></p>
                                ${detailsContentHtml}
                            </div>

                            <!-- Nút Thao tác -->
                            <div class="col-md-2 ms-auto text-md-end d-flex gap-2 justify-content-md-end">
                                <button class="btn btn-outline-primary btn-sm px-3" onclick="editShowtime('${slot.id}')">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>Sửa
                                </button>
                                <button class="btn btn-outline-danger btn-sm px-3" onclick="deleteShowtime('${slot.id}')">
                                    <i class="fa-solid fa-trash me-1"></i>Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Xóa suất chiếu
async function deleteShowtime(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa suất chiếu mã ${id} không?`)) return;

    try {
        const response = await fetch(`/api/showtimes/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok && result.success) {
            alert('Xóa suất chiếu thành công!');
            fetchShowtimes();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể xóa suất chiếu.'));
        }
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Đã xảy ra lỗi kết nối máy chủ!");
    }
}

// Sửa suất chiếu
function editShowtime(id) {
    const slot = showtimesDatabase.find(s => String(s.id) === String(id));
    if (!slot) return;

    const newTime = prompt("Nhập giờ chiếu mới (HH:MM):", slot.time);
    if (newTime) {
        slot.time = newTime;
        renderShowtimeCards();
    }
}


// 4. QUẢN LÝ PHÁT HÀNH VÉ (TICKET CONFIG)

function onMovieChangeInTicketForm() {
    const selectedMovieId = document.getElementById('ticket-select-movie').value;
    const dateSelect = document.getElementById('ticket-select-date');

    const matchedSlots = showtimesDatabase.filter(s => String(s.movieId) === String(selectedMovieId) && !s.isAssigned);
    const uniqueDates = [...new Set(matchedSlots.map(s => s.date))];

    dateSelect.innerHTML = "";
    if (uniqueDates.length === 0) {
        dateSelect.innerHTML = `<option value="" selected disabled>Không có ngày trống cho phim này</option>`;
        dateSelect.disabled = true;
        document.getElementById('ticket-checkboxes-container').innerHTML = `<span class="text-danger small">Phim này hiện không có suất chiếu trống nào khả dụng.</span>`;
        document.getElementById('select-all-wrapper').style.display = "none";
        return;
    }

    dateSelect.disabled = false;
    if (uniqueDates.length === 1) {
        dateSelect.innerHTML = `<option value="${uniqueDates[0]}" selected>${formatDate(uniqueDates[0])}</option>`;
        onDateChangeInTicketForm();
    } else {
        dateSelect.innerHTML = `<option value="" selected disabled>-- Chọn 1 ngày trong ${uniqueDates.length} ngày khả dụng --</option>`;
        uniqueDates.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = formatDate(d);
            dateSelect.appendChild(opt);
        });
        document.getElementById('ticket-checkboxes-container').innerHTML = `<span class="text-muted small">Vui lòng chọn ngày chiếu để xem các suất ca.</span>`;
    }
}

function onDateChangeInTicketForm() {
    const selectedMovieId = document.getElementById('ticket-select-movie').value;
    const selectedDate = document.getElementById('ticket-select-date').value;
    const container = document.getElementById('ticket-checkboxes-container');
    const selectAllWrapper = document.getElementById('select-all-wrapper');

    const matchedSlots = showtimesDatabase.filter(s => String(s.movieId) === String(selectedMovieId) && s.date === selectedDate && !s.isAssigned);

    container.innerHTML = "";
    if (matchedSlots.length === 0) {
        container.innerHTML = `<span class="text-muted small">Không tìm thấy suất ca trống trong ngày này.</span>`;
        selectAllWrapper.style.display = "none";
        return;
    }

    selectAllWrapper.style.display = "block";
    document.getElementById('select-all-slots').checked = false;

    matchedSlots.forEach(slot => {
        const itemHTML = `
            <div>
                <input type="checkbox" name="selectedSlots" class="slot-checkbox-card slot-item-checkbox" id="chk-${slot.id}" value="${slot.id}">
                <label class="slot-checkbox-label" for="chk-${slot.id}">
                    <span><i class="fa-regular fa-clock me-1"></i>${slot.time}</span>
                    <small class="ms-2 badge bg-secondary">${slot.room}</small>
                </label>
            </div>`;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });
}

function toggleSelectAllSlots(master) {
    const checkboxes = document.querySelectorAll('.slot-item-checkbox');
    checkboxes.forEach(chk => chk.checked = master.checked);
}

function calculateVipPricePreview() {
    const regPrice = parseFloat(document.getElementById('ticket-regular-price').value) || 0;
    const vipPercent = parseFloat(document.getElementById('ticket-vip-percent').value) || 0;

    const vipPrice = regPrice + (regPrice * (vipPercent / 100));
    document.getElementById('vip-price-preview').innerHTML = `Dự kiến giá ghế VIP: <strong class="text-dark">${vipPrice.toLocaleString('vi-VN')} VNĐ</strong>`;
}

// Thực thi Tạo vé
async function executeCreateTicket() {
    const selectedSlots = Array.from(document.querySelectorAll('.slot-item-checkbox:checked')).map(cb => cb.value);
    const regPrice = parseFloat(document.getElementById('ticket-regular-price').value);
    const vipPercent = parseFloat(document.getElementById('ticket-vip-percent').value);

    if (selectedSlots.length === 0) {
        alert('Vui lòng tích chọn ít nhất 1 suất chiếu để gán vé!');
        return;
    }

    if (!regPrice || isNaN(vipPercent)) {
        alert('Vui lòng điền giá vé thường và tỉ giá % ghế VIP!');
        return;
    }

    const payload = {
        suatChieuIds: selectedSlots,
        giaVeThuong: regPrice,
        phanTramVip: vipPercent
    };

    try {
        const response = await fetch('/api/tickets/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok && result.success) {
            alert(`Kích hoạt bán vé thành công cho ${selectedSlots.length} suất chiếu!`);
            const modalEl = document.getElementById('createTicketModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
            document.getElementById('createTicketForm').reset();
            document.getElementById('ticket-checkboxes-container').innerHTML = `<span class="text-muted small">Vui lòng chọn Phim và Ngày chiếu để xem danh sách suất chiếu khả dụng.</span>`;
            document.getElementById('select-all-wrapper').style.display = "none";
            fetchShowtimes();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể cấu hình vé.'));
        }
    } catch (error) {
        console.error("Lỗi khi kết nối phát hành vé:", error);
        alert("Đã xảy ra lỗi kết nối với máy chủ!");
    }
}


// 5. TIỆN ÍCH DỊNH DẠNG

function formatDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}