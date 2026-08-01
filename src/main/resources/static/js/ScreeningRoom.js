
const rowsInput = document.getElementById('rowsInput');
const colsInput = document.getElementById('colsInput');
const layoutSelect = document.getElementById('layoutSelect');
const seatGridPreview = document.getElementById('seatGridPreview');
const normalCountDisplay = document.getElementById('normalCount');
const vipCountDisplay = document.getElementById('vipCount');
const totalCountDisplay = document.getElementById('totalCount');

// Tập hợp chứa mã ghế VIP
let vipSeats = new Set();
const API_URL = '/screening-rooms/api';


//LOGIC VẼ SƠ ĐỒ GHẾ - FORM THÊM MỚI
function updateStats() {
    const allSeats = document.querySelectorAll('#seatGridPreview .seat-preview-box:not(.aisle)');
    const total = allSeats.length;
    const vipCount = vipSeats.size;
    const normalCount = total - vipCount;

    if (normalCountDisplay) normalCountDisplay.innerText = normalCount;
    if (vipCountDisplay) vipCountDisplay.innerText = vipCount;
    if (totalCountDisplay) totalCountDisplay.innerText = total;
}
// Modal thông báo thành công
function showNotify(title, message, isSuccess = true) {
    const notifyModalEl = document.getElementById('notifyModal');
    if (!notifyModalEl) return;

    const notifyTitle = document.getElementById('notifyTitle');
    const notifyMessage = document.getElementById('notifyMessage');
    const notifyIcon = document.getElementById('notifyIcon');

    notifyTitle.innerText = title;
    notifyMessage.innerText = message;

    if (isSuccess) {
        notifyIcon.className = 'bi bi-check-circle-fill text-primary';
        notifyTitle.className = 'fw-bold text-primary mb-2';
    } else {
        notifyIcon.className = 'bi bi-x-circle-fill text-danger';
        notifyTitle.className = 'fw-bold text-danger mb-2';
    }

    const modalInstance = bootstrap.Modal.getOrCreateInstance(notifyModalEl);
    modalInstance.show();
}

function renderMatrix() {
    if (!rowsInput || !colsInput || !seatGridPreview) return;

    const rows = parseInt(rowsInput.value) || 0;
    const cols = parseInt(colsInput.value) || 0;
    const layout = layoutSelect.value;

    let finalCols = cols;
    let aisleIndex = -1;

    if (layout === 'center' && cols > 1) {
        finalCols = cols + 1;
        aisleIndex = Math.floor(cols / 2);
    }

    seatGridPreview.style.gridTemplateColumns = `repeat(${finalCols}, 1fr)`;
    seatGridPreview.innerHTML = '';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let r = 0; r < rows; r++) {
        const rowLabel = alphabet[r] || 'X';
        let seatNumInRow = 1;

        for (let c = 0; c < finalCols; c++) {
            const seatBox = document.createElement('div');

            if (layout === 'center' && c === aisleIndex) {
                seatBox.className = 'seat-preview-box aisle';
                seatBox.style.background = 'transparent';
                seatBox.style.border = 'none';
                seatBox.style.cursor = 'default';
                seatBox.innerText = '';
            } else {
                const colLabel = seatNumInRow < 10 ? '0' + seatNumInRow : seatNumInRow;
                const seatId = `${rowLabel}${colLabel}`;

                seatBox.className = 'seat-preview-box';
                if (vipSeats.has(seatId)) seatBox.classList.add('vip');
                seatBox.innerText = seatId;

                seatBox.addEventListener('click', function() {
                    if (vipSeats.has(seatId)) {
                        vipSeats.delete(seatId);
                        this.classList.remove('vip');
                    } else {
                        vipSeats.add(seatId);
                        this.classList.add('vip');
                    }
                    updateStats();
                });

                seatNumInRow++;
            }
            seatGridPreview.appendChild(seatBox);
        }
    }
    updateStats();
}

function handleDimensionChange() {
    vipSeats.clear();
    renderMatrix();
}

if (rowsInput) rowsInput.addEventListener('input', handleDimensionChange);
if (colsInput) colsInput.addEventListener('input', handleDimensionChange);
if (layoutSelect) layoutSelect.addEventListener('change', handleDimensionChange);


function updateEditStats() {
    const allSeats = document.querySelectorAll('#editseatGridPreview .seat-preview-box:not(.aisle)');
    const total = allSeats.length;
    const vipCount = vipSeats.size;
    const normalCount = total - vipCount;

    const editNormal = document.getElementById('editnormalCount');
    const editVip = document.getElementById('editvipCount');
    const editTotal = document.getElementById('edittotalCount');

    if (editNormal) editNormal.innerText = normalCount;
    if (editVip) editVip.innerText = vipCount;
    if (editTotal) editTotal.innerText = total;
}

function renderEditMatrix() {
    const rowsInputEdit = document.getElementById('editrowsInput');
    const colsInputEdit = document.getElementById('editcolsInput');
    const layoutSelectEdit = document.getElementById('editlayoutSelect');
    const seatGridPreviewEdit = document.getElementById('editseatGridPreview');

    if (!rowsInputEdit || !colsInputEdit || !seatGridPreviewEdit) return;

    const rows = parseInt(rowsInputEdit.value) || 0;
    const cols = parseInt(colsInputEdit.value) || 0;
    const layout = layoutSelectEdit.value;

    let finalCols = cols;
    let aisleIndex = -1;

    if (layout === 'center' && cols > 1) {
        finalCols = cols + 1;
        aisleIndex = Math.floor(cols / 2);
    }

    seatGridPreviewEdit.style.gridTemplateColumns = `repeat(${finalCols}, 1fr)`;
    seatGridPreviewEdit.innerHTML = '';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let r = 0; r < rows; r++) {
        const rowLabel = alphabet[r] || 'X';
        let seatNumInRow = 1;

        for (let c = 0; c < finalCols; c++) {
            if (layout === 'center' && c === aisleIndex) {
                const aisleBox = document.createElement('div');
                aisleBox.className = 'seat-preview-box aisle';
                aisleBox.style.background = 'transparent';
                aisleBox.style.border = 'none';
                aisleBox.style.cursor = 'default';
                aisleBox.innerText = '';
                seatGridPreviewEdit.appendChild(aisleBox);
                continue;
            }

            const colLabel = seatNumInRow < 10 ? '0' + seatNumInRow : seatNumInRow;
            const seatId = `${rowLabel}${colLabel}`;

            const seatBox = document.createElement('div');
            seatBox.className = 'seat-preview-box';
            seatBox.innerText = seatId;

            // Đánh dấu VIP từ tập hợp vipSeats
            if (vipSeats.has(seatId)) {
                seatBox.classList.add('vip');
            }

            seatBox.addEventListener('click', function() {
                if (vipSeats.has(seatId)) {
                    vipSeats.delete(seatId);
                    this.classList.remove('vip');
                } else {
                    vipSeats.add(seatId);
                    this.classList.add('vip');
                }
                updateEditStats();
            });

            seatGridPreviewEdit.appendChild(seatBox);
            seatNumInRow++;
        }
    }
    updateEditStats();
}


//KẾT NỐI API VÀ THAO TÁC CSDL

document.addEventListener('DOMContentLoaded', function () {
    loadScreeningRooms();

    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm) {
        addRoomForm.addEventListener('submit', function (e) {
            e.preventDefault();
            createScreeningRoom();
        });
    }

    // Sự kiện thay đổi kích thước form Edit
    const editRows = document.getElementById('editrowsInput');
    const editCols = document.getElementById('editcolsInput');
    const editLayout = document.getElementById('editlayoutSelect');

    if (editRows) editRows.addEventListener('input', renderEditMatrix);
    if (editCols) editCols.addEventListener('input', renderEditMatrix);
    if (editLayout) editLayout.addEventListener('change', renderEditMatrix);
});

// A. Lấy danh sách phòng chiếu
async function loadScreeningRooms() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) return;

        const roomList = await response.json();
        const container = document.getElementById('roomCardContainer');
        if (!container) return;

        container.innerHTML = '';

        if (roomList.length === 0) {
            container.innerHTML = `<div class="col-12 text-muted">Chưa có phòng chiếu nào trong hệ thống.</div>`;
            return;
        }

        roomList.forEach(room => {
            const cardHtml = `
                <div class="col-xl-4 col-md-6" id="room-card-${room.id}">
                    <div class="card room-card p-4" style="background: var(--purple-radiant); color: white;">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="fw-bold text-dark mb-1">${room.tenPhong}</h5>
                                <small class="text-white-50">Mã: ${room.id}</small>
                            </div>
                            <div class="text-end">
                                <span class="fs-4 fw-bold text-dark d-block total-seats-display">${room.tongSoGhe}</span>
                                <small class="text-white-50">Tổng số ghế</small>
                            </div>
                        </div>
                        <div class="mb-3 fs-7">
                            <span class="badge bg-light text-dark me-2 badge-normal">Thường: ${room.soLuongGheThuong}</span>
                            <span class="badge bg-warning text-dark me-2 badge-vip">VIP: ${room.soLuongGheVip}</span>
                            <span class="badge bg-info text-dark badge-aisle">${room.coLoiDi ? 'Có lối đi' : 'Không lối đi'}</span>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-light btn-sm text-secondary w-100 fw-semibold" onclick="editScreeningRoom('${room.id}')">Sửa sơ đồ</button>
                            <button class="btn btn-light btn-sm text-danger fw-semibold" onclick="deleteScreeningRoom('${room.id}')"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });
    } catch (error) {
        console.error('Lỗi tải danh sách phòng chiếu:', error);
    }
}

//  Tạo mới phòng chiếu (Kèm sơ đồ ghế JSON)
async function createScreeningRoom() {
    const roomNameInput = document.getElementById('roomNameInput');
    const tenPhong = roomNameInput ? roomNameInput.value.trim() : '';
    const soLuongGheThuong = parseInt(normalCountDisplay.innerText) || 0;
    const soLuongGheVip = parseInt(vipCountDisplay.innerText) || 0;
    const soHangGhe = parseInt(rowsInput.value) || 0;
    const soCotGhe = parseInt(colsInput.value) || 0;
    const coLoiDi = layoutSelect.value === 'center';

    const allSeats = document.querySelectorAll('#seatGridPreview .seat-preview-box:not(.aisle)');
    const seatLayoutData = Array.from(allSeats).map(seatBox => {
        const seatId = seatBox.innerText;
        return {
            code: seatId,
            row: seatId.charAt(0),
            col: parseInt(seatId.substring(1)),
            type: vipSeats.has(seatId) ? 'VIP' : 'NORMAL'
        };
    });

    const requestData = {
        tenPhong,
        soLuongGheThuong,
        soLuongGheVip,
        soHangGhe,
        soCotGhe,
        coLoiDi,
        seatLayout: seatLayoutData
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const modalElement = document.getElementById('addRoomModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            document.getElementById('addRoomForm').reset();
            vipSeats.clear();
            renderMatrix();
            loadScreeningRooms();

            showNotify('Thành Công!', 'Đã thêm phòng chiếu mới vào hệ thống.', true);
        } else {
            const errorData = await response.json();
            showNotify('Thất Bại!', errorData.message || 'Không thể thêm phòng chiếu.', false);
        }
    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu:', error);
        showNotify('Lỗi Kết Nối!', 'Không thể kết nối tới Server.', false);
    }
}

// Mở Modal Chỉnh Sửa Phòng Chiếu
async function editScreeningRoom(roomId) {
    try {
        const response = await fetch(`${API_URL}/${roomId}`);
        if (!response.ok) throw new Error('Không thể tải thông tin phòng chiếu');

        const room = await response.json();

        // Gán dữ liệu cơ bản lên Form
        document.getElementById('editroomNameInput').value = room.tenPhong;
        document.getElementById('editrowsInput').value = room.soHangGhe;
        document.getElementById('editcolsInput').value = room.soCotGhe;
        document.getElementById('editlayoutSelect').value = room.coLoiDi ? 'center' : 'none';

        // Nạp tập hợp ghế VIP từ mảng seatLayout trong CSDL
        vipSeats.clear();
        if (room.seatLayout && Array.isArray(room.seatLayout)) {
            room.seatLayout.forEach(seat => {
                if (seat.type === 'VIP') {
                    vipSeats.add(seat.code);
                }
            });
        }

        // Vẽ lại sơ đồ phòng chiếu trong Modal Sửa
        renderEditMatrix();

        // Mở Modal
        const modalElement = document.getElementById('editRoomModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();

        // Gán sự kiện submit cho Form Chỉnh Sửa
        const form = document.getElementById('editRoomForm');
        form.onsubmit = async function(e) {
            e.preventDefault();
            await updateScreeningRoom(roomId);
        };
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu phòng:', error);
        alert('Không thể tải dữ liệu phòng chiếu!');
    }
}

// D. Cập nhật phòng chiếu (Kèm sơ đồ ghế JSON)
async function updateScreeningRoom(roomId) {
    const tenPhong = document.getElementById('editroomNameInput').value.trim();
    const soLuongGheThuong = parseInt(document.getElementById('editnormalCount').innerText) || 0;
    const soLuongGheVip = parseInt(document.getElementById('editvipCount').innerText) || 0;
    const coLoiDi = document.getElementById('editlayoutSelect').value === 'center';
    const soHangGhe = parseInt(document.getElementById('editrowsInput').value) || 0;
    const soCotGhe = parseInt(document.getElementById('editcolsInput').value) || 0;

    const allSeats = document.querySelectorAll('#editseatGridPreview .seat-preview-box:not(.aisle)');
    const seatLayoutData = Array.from(allSeats).map(seatBox => {
        const seatId = seatBox.innerText;
        return {
            code: seatId,
            row: seatId.charAt(0),
            col: parseInt(seatId.substring(1)),
            type: vipSeats.has(seatId) ? 'VIP' : 'NORMAL'
        };
    });

    const requestData = {
        tenPhong,
        soLuongGheThuong,
        soLuongGheVip,
        soHangGhe,
        soCotGhe,
        coLoiDi,
        seatLayout: seatLayoutData
    };

    try {
        const response = await fetch(`${API_URL}/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const updatedRoom = await response.json();

            const modalElement = document.getElementById('editRoomModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            updateRoomCard(updatedRoom);
            showNotify('Thành Công!', 'Thông tin phòng chiếu đã được cập nhật.', true);
        } else {
            const errorData = await response.json();
            showNotify('Thất Bại!', errorData.message || 'Không thể cập nhật phòng chiếu.', false);
        }

    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        showNotify('Lỗi Kết Nối!', 'Không thể kết nối tới Server.', false);
    }
}

//  Xóa phòng chiếu
async function deleteScreeningRoom(roomId) {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng chiếu này?')) return;

    try {
        const response = await fetch(`${API_URL}/${roomId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const cardElement = document.getElementById(`room-card-${roomId}`);
            if (cardElement) {
                cardElement.remove();
            } else {
                loadScreeningRooms();
            }
            showNotify('Thành Công!', 'Phòng chiếu đã được xóa khỏi hệ thống.', true);
        } else {
            const errorData = await response.json().catch(() => ({}));
            showNotify('Không Thể Xóa!', errorData.message || 'Phòng chiếu đang chứa dữ liệu liên quan.', false);
        }
    } catch (error) {
        console.error('Lỗi khi xóa phòng chiếu:', error);
        showNotify('Lỗi Kết Nối!', 'Không thể kết nối tới Server.', false);
    }
}

//  Hàm cập nhật lại giao diện thẻ Card
function updateRoomCard(room) {
    const cardElement = document.getElementById(`room-card-${room.id}`);
    if (!cardElement) return;

    // Cập nhật Tên phòng
    const titleEl = cardElement.querySelector('h5.fw-bold');
    if (titleEl) titleEl.textContent = room.tenPhong;

    // Cập nhật Tổng số ghế (Lấy giá trị tongSoGhe do Spring Boot tính toán trả về)
    const totalEl = cardElement.querySelector('.total-seats-display');
    if (totalEl) totalEl.textContent = room.tongSoGhe;

    // Cập nhật các Badge thông số
    const badgeNormal = cardElement.querySelector('.badge-normal');
    if (badgeNormal) badgeNormal.textContent = `Thường: ${room.soLuongGheThuong}`;

    const badgeVip = cardElement.querySelector('.badge-vip');
    if (badgeVip) badgeVip.textContent = `VIP: ${room.soLuongGheVip}`;

    const badgeAisle = cardElement.querySelector('.badge-aisle');
    if (badgeAisle) badgeAisle.textContent = room.coLoiDi ? 'Có lối đi' : 'Không lối đi';
}