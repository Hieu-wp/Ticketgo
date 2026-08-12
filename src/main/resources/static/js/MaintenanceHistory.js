const API_BASE_URL = '/screening-rooms/api';
let allHistoryData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadRoomOptions();
    await fetchMaintenanceHistory();

    // Lắng nghe sự kiện thay đổi trên các ô lọc
    document.getElementById('filterRoom').addEventListener('change', renderHistory);
    document.getElementById('filterStatus').addEventListener('change', renderHistory);
    document.getElementById('filterType').addEventListener('change', renderHistory);

    // Gắn thêm sự kiện click cho nút "Lọc" (nếu có)
    const btnFilter = document.getElementById('btnApplyFilter');
    if (btnFilter) {
        btnFilter.addEventListener('click', renderHistory);
    }
});
// 1. Tải danh sách phòng chiếu nạp vào Select Lọc Phòng
async function loadRoomOptions() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) return;

        const rooms = await response.json();
        const roomSelect = document.getElementById('filterRoom');

        // Giữ lại option mặc định "Tất cả phòng"
        roomSelect.innerHTML = '<option value="">Tất cả phòng</option>';

        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.tenPhong;
            option.textContent = room.tenPhong;
            roomSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi nạp danh sách phòng:', error);
    }
}

// 2. Lấy toàn bộ danh sách Lịch sử bảo trì từ Backend
async function fetchMaintenanceHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance-history`);
        if (response.ok) {
            allHistoryData = await response.json();
            renderHistory();
        } else {
            console.error('Lỗi khi tải lịch sử bảo trì');
        }
    } catch (error) {
        console.error('Lỗi kết nối máy chủ:', error);
    }
}

// 3. Hàm Lọc và Render Danh Sách Lịch Sử
function renderHistory() {
    const selectedRoom = document.getElementById('filterRoom').value;
    const selectedStatus = document.getElementById('filterStatus').value;
    const selectedType = document.getElementById('filterType').value;

    const filteredData = allHistoryData.filter(item => {
        const matchRoom = !selectedRoom || item.tenPhong === selectedRoom;
        const matchStatus = !selectedStatus || item.trangThai === selectedStatus;
        const matchType = !selectedType || item.loaiBaoTri === selectedType;
        return matchRoom && matchStatus && matchType;
    });

    const historyContainer = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    historyContainer.innerHTML = '';

    if (filteredData.length === 0) {
        emptyState.classList.remove('d-none');
        return;
    }
    emptyState.classList.add('d-none');

    // HIỂN THỊ CARD NGANG (col-12)
    filteredData.forEach(item => {
        const isCompleted = item.trangThai === 'Hoàn thành';
        const badgeClass = isCompleted ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';

        // Hiển thị giờ bắt đầu và giờ kết thúc
        const timeDisplay = isCompleted
            ? `${item.ngayBatDau}  →  ${item.ngayKetThuc}`
            : `Bắt đầu: ${item.ngayBatDau} (Đang thực hiện)`;

        const cardHtml = `
            <div class="col-12 mb-3">
                <div class="card border-0 shadow-sm rounded-4 p-3">
                    <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <h5 class="fw-bold mb-0 text-dark">${item.tenPhong}</h5>
                                <span class="badge ${badgeClass} rounded-pill px-3 py-1 fs-7">${item.trangThai}</span>
                            </div>

                            <!-- Hiển thị Ngày + Giờ Chi Tiết -->
                            <div class="small text-muted mb-2">
                                <i class="fa-regular fa-clock me-2 text-primary"></i><strong>${timeDisplay}</strong>
                            </div>

                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-light text-secondary border px-2 py-1">${item.loaiBaoTri}</span>
                                <span class="small text-muted"><i class="fa-solid fa-user me-1"></i>${item.nguoiThucHien || 'Chưa phân công'}</span>
                            </div>
                        </div>

                        <div class="text-end d-flex flex-column align-items-end gap-2">
                            <span class="fw-bold fs-5 text-primary">${formatCurrency(item.chiPhi)}</span>
                            <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="showDetail('${item.id}')">
                                <i class="fa-solid fa-eye me-1"></i>Chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        historyContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 4. Mở Modal Hiển Thị Chi Tiết Lịch Sử Bảo Trì
function showDetail(id) {
    const item = allHistoryData.find(h => String(h.id) === String(id));
    if (!item) return;

    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <small class="text-muted d-block">Phòng chiếu</small>
                <h6 class="fw-bold">${item.tenPhong}</h6>
            </div>
            <div class="col-md-6">
                <small class="text-muted d-block">Trạng thái</small>
                <h6 class="fw-bold text-primary">${item.trangThai}</h6>
            </div>
            <div class="col-md-6">
                <small class="text-muted d-block">Loại bảo trì</small>
                <p class="fw-semibold mb-0">${item.loaiBaoTri}</p>
            </div>
            <div class="col-md-6">
                <small class="text-muted d-block">Người thực hiện</small>
                <p class="fw-semibold mb-0">${item.nguoiThucHien}</p>
            </div>
            <div class="col-md-6">
                <small class="text-muted d-block">Ngày bắt đầu</small>
                <p class="fw-semibold mb-0">${item.ngayBatDau}</p>
            </div>
            <div class="col-md-6">
                <small class="text-muted d-block">Ngày kết thúc dự kiến / thực tế</small>
                <p class="fw-semibold mb-0">${item.ngayKetThuc || 'Đang cập nhật'}</p>
            </div>
            <div class="col-12">
                <small class="text-muted d-block">Chi phí bảo trì</small>
                <p class="fw-bold text-danger fs-5 mb-0">${formatCurrency(item.chiPhi)}</p>
            </div>
            <div class="col-12 border-top pt-2">
                <small class="text-muted d-block">Mô tả công việc</small>
                <p class="bg-light p-3 rounded-3 text-secondary mb-0">${item.moTa || 'Không có mô tả'}</p>
            </div>
            <div class="col-12">
                <small class="text-muted d-block">Ghi chú bổ sung</small>
                <p class="bg-light p-3 rounded-3 text-secondary mb-0">${item.ghiChu || 'Không có ghi chú'}</p>
            </div>
        </div>
    `;

    const detailModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('detailModal'));
    detailModal.show();
}


// Hàm hỗ trợ định dạng tiền VNĐ
function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}