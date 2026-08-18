// ==================== CẤU HÌNH & TRẠNG THÁI ====================
let currentPage = 0;
const pageSize = 6;
let debounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadPromoCodes();

    const todayStr = getTodayString();
    const startDateInput = document.getElementById('c_start');
    const endDateInput = document.getElementById('c_end');

    if (startDateInput) {
        startDateInput.value = todayStr;
        startDateInput.min = todayStr;
    }
    if (endDateInput) {
        endDateInput.min = todayStr;
    }

    updatePreview();
});

// ==================== 1. HIỂN THỊ MODAL THÔNG BÁO & XÁC NHẬN ====================

function showNotification(type, title, message, callback = null) {
    let modalEl = document.getElementById('appNotificationModal');

    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="appNotificationModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content text-center">
                        <div class="modal-header border-0 pb-0 justify-content-end">
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body px-4 py-2">
                            <i id="appNotifIcon" class="fs-1 mb-3 display-4"></i>
                            <h6 class="fw-bold mb-2" id="appNotifTitle"></h6>
                            <p id="appNotifMessage" class="mb-0 text-secondary small"></p>
                        </div>
                        <div class="modal-footer border-0 pt-2 pb-3 justify-content-center">
                            <button type="button" class="btn btn-purple btn-sm px-4" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalEl = document.getElementById('appNotificationModal');
    }

    const iconEl = document.getElementById('appNotifIcon');
    document.getElementById('appNotifTitle').textContent = title;
    document.getElementById('appNotifMessage').textContent = message;

    if (type === 'success') {
        iconEl.className = 'fa-solid fa-circle-check text-success fs-1 mb-2';
    } else if (type === 'error') {
        iconEl.className = 'fa-solid fa-circle-xmark text-danger fs-1 mb-2';
    } else if (type === 'warning') {
        iconEl.className = 'fa-solid fa-triangle-exclamation text-warning fs-1 mb-2';
    } else {
        iconEl.className = 'fa-solid fa-circle-info text-info fs-1 mb-2';
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    if (callback) {
        const handler = () => {
            callback();
            modalEl.removeEventListener('hidden.bs.modal', handler);
        };
        modalEl.addEventListener('hidden.bs.modal', handler, { once: true });
    }
}

function showConfirmModal(title, message, onConfirm) {
    let modalEl = document.getElementById('appConfirmModal');

    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="appConfirmModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content text-center">
                        <div class="modal-header border-0 pb-0 justify-content-end">
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body px-4 py-2">
                            <i class="fa-solid fa-circle-question text-warning fs-1 mb-2"></i>
                            <h6 class="fw-bold mb-2" id="appConfirmTitle"></h6>
                            <p id="appConfirmMessage" class="mb-0 text-secondary small"></p>
                        </div>
                        <div class="modal-footer border-0 pt-2 pb-3 d-flex justify-content-center gap-2">
                            <button type="button" class="btn btn-light-custom btn-sm px-3" data-bs-dismiss="modal">Hủy</button>
                            <button type="button" class="btn btn-danger btn-sm px-3" id="appConfirmAcceptBtn">Xác nhận</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalEl = document.getElementById('appConfirmModal');
    }

    document.getElementById('appConfirmTitle').textContent = title;
    document.getElementById('appConfirmMessage').textContent = message;

    const oldBtn = document.getElementById('appConfirmAcceptBtn');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    newBtn.addEventListener('click', () => {
        modal.hide();
        onConfirm();
    });

    modal.show();
}

// ==================== 2. HÀM CHUẨN HÓA & VALIDATION ====================

function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function validateFormData(data, isEdit = false) {
    if (!data.code || !data.code.trim()) return "Vui lòng nhập mã giảm giá!";
    if (!data.name || !data.name.trim()) return "Vui lòng nhập tên chương trình!";
    if (data.discountValue === null || isNaN(data.discountValue) || data.discountValue <= 0) {
        return "Giá trị giảm phải là số lớn hơn 0!";
    }
    if (data.minOrder === null || isNaN(data.minOrder) || data.minOrder < 0) {
        return "Đơn hàng tối thiểu không hợp lệ!";
    }
    if (data.usageLimit === null || isNaN(data.usageLimit) || data.usageLimit <= 0) {
        return "Lượt sử dụng phải là số nguyên lớn hơn 0!";
    }

    if (!data.startDate) return "Vui lòng chọn ngày bắt đầu!";
    if (!data.endDate) return "Vui lòng chọn ngày kết thúc!";

    const todayStr = getTodayString();

    if (!isEdit && data.startDate < todayStr) {
        return "Ngày bắt đầu phải từ ngày hôm nay trở đi!";
    }
    if (data.endDate <= todayStr) {
        return "Ngày kết thúc phải lớn hơn ngày hôm nay!";
    }
    if (data.endDate <= data.startDate) {
        return "Ngày kết thúc phải lớn hơn ngày bắt đầu!";
    }

    return null;
}

// Thu thập và làm sạch Payload dữ liệu trước khi POST/PUT
function buildPayload(modalId, prefix) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return {};

    const getVal = (id) => {
        const el = modalEl.querySelector(`#${id}`);
        return el ? el.value.trim() : '';
    };

    const isPercent = modalEl.querySelector(`#${prefix}type_percent`)?.checked;
    const maxDisc = getVal(`${prefix}maxDiscount`);
    const discountVal = getVal(`${prefix}discountValue`);

    return {
        code: getVal(`${prefix}code`).toUpperCase(),
        name: getVal(`${prefix}name`),
        discountType: isPercent ? 'percent' : 'fixed',
        discountValue: discountVal !== '' ? Number(discountVal) : null,
        minOrder: getVal(`${prefix}minOrder`) !== '' ? Number(getVal(`${prefix}minOrder`)) : 0,
        maxDiscount: maxDisc !== '' ? Number(maxDisc) : null,
        startDate: getVal(`${prefix}start`),
        endDate: getVal(`${prefix}end`),
        usageLimit: getVal(`${prefix}usage`) ? Number(getVal(`${prefix}usage`)) : null,
        customerType: getVal(`${prefix}customer`) || 'Tất cả khách hàng',
        isActive: modalEl.querySelector(`#${prefix}active`) ? modalEl.querySelector(`#${prefix}active`).checked : true
    };
}

// ==================== 3. LOAD DANH SÁCH & PHÂN TRANG ====================

async function loadPromoCodes(page = 0) {
    currentPage = page;
    const keyword = document.getElementById('searchInput')?.value.trim() || '';
    const status = document.getElementById('statusFilter')?.value || '';

    const params = new URLSearchParams({
        keyword: keyword,
        status: status,
        page: currentPage,
        size: pageSize
    });

    try {
        const response = await fetch(`/promo-codes/api?${params}`); //[cite: 1]
        const result = await response.json();

        if (response.ok && result.success) {
            renderCards(result.data);
            // Đúng tên thuộc tính currentPage từ PromoCodeResponse[cite: 2]
            renderPagination(result.currentPage, result.totalPages, result.totalElements);
        } else {
            showNotification('error', 'Lỗi tải dữ liệu', result.message || 'Không thể lấy danh sách mã giảm giá.');
        }
    } catch (error) {
        showNotification('error', 'Lỗi kết nối', 'Không thể kết nối tới máy chủ.');
    }
}

function onSearchOrFilterChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadPromoCodes(0);
    }, 300);
}

function renderCards(list) {
    const container = document.getElementById('voucherList');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    container.innerHTML = '';

    if (!list || list.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }
    if (emptyState) emptyState.classList.add('d-none');

    list.forEach(item => {
        const statusBadge = getStatusBadge(item.status);
        const discountText = item.discountType === 'percent'
            ? `Giảm ${item.discountValue}%`
            : `Giảm ${formatCurrency(item.discountValue)}₫`;

        const cardHtml = `
            <div class="col-md-6 col-lg-4">
                <div class="voucher-card">
                    <div class="voucher-card-top">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="voucher-code">${item.code}</span>
                            ${statusBadge}
                        </div>
                        <h6 class="fw-bold mb-0 text-dark text-truncate">${item.name}</h6>
                        <div class="voucher-discount">${discountText}</div>
                    </div>
                    <div class="voucher-card-body">
                        <div class="voucher-info">
                            <span>Đơn tối thiểu</span>
                            <strong>${formatCurrency(item.minOrder)} ₫</strong>
                        </div>
                        <div class="voucher-info">
                            <span>Hạn sử dụng</span>
                            <strong>${formatDate(item.startDate)} - ${formatDate(item.endDate)}</strong>
                        </div>
                        <div class="voucher-info">
                            <span>Đối tượng</span>
                            <strong>${item.customerType || 'Tất cả'}</strong>
                        </div>
                        <div class="voucher-info">
                            <span>Lượt sử dụng</span>
                            <strong>${item.usedCount || 0} / ${item.usageLimit}</strong>
                        </div>
                        <div class="voucher-actions">
                            <button type="button" class="btn-card-action primary" onclick="openViewModal('${item.id}')">
                                <i class="fa-solid fa-eye me-1"></i> Xem
                            </button>
                            <button type="button" class="btn-card-action" onclick="openEditModal('${item.id}')">
                                <i class="fa-solid fa-pen me-1"></i> Sửa
                            </button>
                            <button type="button" class="btn-card-action text-danger" onclick="confirmDelete('${item.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function renderPagination(page, totalPages, totalElements) {
    const totalCountEl = document.getElementById('totalCount');
    const pageInfoEl = document.getElementById('pageInfo');
    const paginationEl = document.getElementById('pagination');

    if (totalCountEl) totalCountEl.textContent = `Tổng: ${totalElements || 0} mã`;

    const start = totalElements === 0 ? 0 : page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalElements);
    if (pageInfoEl) pageInfoEl.textContent = `Hiển thị ${start} - ${end} trên ${totalElements}`;

    if (!paginationEl) return;
    paginationEl.innerHTML = '';

    if (!totalPages || totalPages <= 1) return;

    paginationEl.insertAdjacentHTML('beforeend', `
        <li class="page-item ${page === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadPromoCodes(${page - 1})">Trước</a>
        </li>
    `);

    for (let i = 0; i < totalPages; i++) {
        paginationEl.insertAdjacentHTML('beforeend', `
            <li class="page-item ${i === page ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadPromoCodes(${i})">${i + 1}</a>
            </li>
        `);
    }

    paginationEl.insertAdjacentHTML('beforeend', `
        <li class="page-item ${page === totalPages - 1 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadPromoCodes(${page + 1})">Sau</a>
        </li>
    `);
}

// ==================== 4. TẠO MỚI & REALTIME PREVIEW ====================

function openCreateForm() {
    const form = document.getElementById('createForm');
    if (form) form.reset();

    const todayStr = getTodayString();
    document.getElementById('c_start').value = todayStr;
    toggleDiscountType('create');
    updatePreview();
}

function toggleDiscountType(modalType) {
    const prefix = modalType === 'create' ? 'c_' : 'e_';
    const isPercent = document.getElementById(`${prefix}type_percent`)?.checked;

    const labelEl = document.getElementById(`${prefix}discountLabel`);
    const unitEl = document.getElementById(`${prefix}discountUnit`);

    if (labelEl) labelEl.textContent = isPercent ? 'Giá trị giảm (%) *' : 'Số tiền giảm (₫) *';
    if (unitEl) unitEl.textContent = isPercent ? '%' : '₫';
}

function updatePreview() {
    const getVal = (id) => document.getElementById(id)?.value || '';

    const code = getVal('c_code').toUpperCase() || 'MÃ_GIẢM_GIÁ';
    const name = getVal('c_name') || 'Tên chương trình ưu đãi';
    const isPercent = document.getElementById('c_type_percent')?.checked;
    const value = getVal('c_discountValue') || '0';
    const minOrder = getVal('c_minOrder');
    const maxDiscount = getVal('c_maxDiscount');
    const start = getVal('c_start');
    const end = getVal('c_end');
    const customer = getVal('c_customer') || 'Tất cả khách hàng';
    const usage = getVal('c_usage') || '--';

    const pCode = document.getElementById('preview_code');
    const pName = document.getElementById('preview_name');
    const pDiscount = document.getElementById('preview_discount');
    const pMin = document.getElementById('preview_min');
    const pMax = document.getElementById('preview_max');
    const pTime = document.getElementById('preview_time');
    const pCustomer = document.getElementById('preview_customer');
    const pUsage = document.getElementById('preview_usage');

    if (pCode) pCode.textContent = code;
    if (pName) pName.textContent = name;
    if (pDiscount) pDiscount.textContent = isPercent ? `Giảm ${value}%` : `Giảm ${formatCurrency(value)}₫`;
    if (pMin) pMin.textContent = minOrder ? `${formatCurrency(minOrder)} ₫` : '0 ₫';
    if (pMax) pMax.textContent = maxDiscount ? `${formatCurrency(maxDiscount)} ₫` : 'Không giới hạn';
    if (pTime) pTime.textContent = `${formatDate(start)} - ${formatDate(end)}`;
    if (pCustomer) pCustomer.textContent = customer;
    if (pUsage) pUsage.textContent = `${usage} lượt`;
}

async function submitCreate(event) {
    event.preventDefault();

    const data = buildPayload('createModal', 'c_');
    console.log(">>> Payload gửi khi TẠO MỚI:", data); // Kiểm tra giá trị discountValue tại F12 Console

    const validationError = validateFormData(data, false);
    if (validationError) {
        showNotification('warning', 'Dữ liệu không hợp lệ', validationError);
        return;
    }

    try {
        const response = await fetch('/promo-codes/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok && result.success) {
            const modalEl = document.getElementById('createModal');
            if (modalEl) (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).hide();

            showNotification('success', 'Thành công', 'Đã tạo mới mã giảm giá thành công!', () => {
                loadPromoCodes(0);
            });
        } else {
            const errorMsg = result.message || (result.errors ? Object.values(result.errors).join(', ') : 'Dữ liệu không hợp lệ');
            showNotification('error', 'Tạo thất bại', errorMsg);
        }
    } catch (error) {
        showNotification('error', 'Lỗi hệ thống', 'Có lỗi xảy ra khi gửi dữ liệu lên máy chủ.');
    }
}

// ==================== 5. CHỈNH SỬA ====================

async function openEditModal(id) {
    try {
        const response = await fetch(`/promo-codes/api/${id}`); //[cite: 1]
        const result = await response.json();

        if (response.ok && result.success) {
            const data = result.data;
            document.getElementById('e_id').value = data.id;
            document.getElementById('e_name').value = data.name;
            document.getElementById('e_code').value = data.code;

            if (data.discountType === 'percent') {
                document.getElementById('e_type_percent').checked = true;
            } else {
                document.getElementById('e_type_fixed').checked = true;
            }
            toggleDiscountType('edit');

            document.getElementById('e_discountValue').value = data.discountValue;
            document.getElementById('e_maxDiscount').value = data.maxDiscount !== null ? data.maxDiscount : '';
            document.getElementById('e_minOrder').value = data.minOrder;
            document.getElementById('e_start').value = data.startDate;
            document.getElementById('e_end').value = data.endDate;
            document.getElementById('e_usage').value = data.usageLimit;
            document.getElementById('e_customer').value = data.customerType || 'Tất cả khách hàng';

            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editModal'));
            modal.show();
        } else {
            showNotification('error', 'Lỗi', result.message || 'Không tìm thấy dữ liệu.');
        }
    } catch (error) {
        showNotification('error', 'Lỗi kết nối', 'Không thể lấy thông tin chi tiết mã giảm giá.');
    }
}

async function submitEdit(event) {
    event.preventDefault();

    const id = document.getElementById('e_id').value;
    const data = buildPayload('editModal', 'e_');
    console.log(">>> Payload gửi khi CHỈNH SỬA:", data); // Kiểm tra xem JS gửi 15 hay bị gửi số khác

    const validationError = validateFormData(data, true);
    if (validationError) {
        showNotification('warning', 'Dữ liệu không hợp lệ', validationError);
        return;
    }

    try {
        const response = await fetch(`/promo-codes/api/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok && result.success) {
            const modalEl = document.getElementById('editModal');
            if (modalEl) (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).hide();

            showNotification('success', 'Thành công', 'Đã cập nhật thông tin mã giảm giá!', () => {
                loadPromoCodes(currentPage);
            });
        } else {
            const errorMsg = result.message || (result.errors ? Object.values(result.errors).join(', ') : 'Cập nhật thất bại.');
            showNotification('error', 'Lỗi cập nhật', errorMsg);
        }
    } catch (error) {
        showNotification('error', 'Lỗi hệ thống', 'Có lỗi xảy ra khi gửi dữ liệu chỉnh sửa.');
    }
}

// ==================== 6. XEM CHI TIẾT & XÓA ====================

async function openViewModal(id) {
    try {
        const response = await fetch(`/promo-codes/api/${id}`); //[cite: 1]
        const result = await response.json();

        if (response.ok && result.success) {
            const item = result.data;
            const discountText = item.discountType === 'percent' ? `${item.discountValue}%` : `${formatCurrency(item.discountValue)} ₫`;

            const viewBody = document.getElementById('viewModalBody');
            if (viewBody) {
                viewBody.innerHTML = `
                    <div class="text-center mb-3">
                        <span class="badge bg-purple fs-6 px-3 py-2">${item.code}</span>
                        <h5 class="fw-bold mt-2 text-dark">${item.name}</h5>
                        ${getStatusBadge(item.status)}
                    </div>
                    <hr>
                    <div class="row g-2 small">
                        <div class="col-6 text-muted">Loại giảm giá:</div>
                        <div class="col-6 fw-semibold text-end">${item.discountType === 'percent' ? 'Phần trăm' : 'Cố định'}</div>
                        <div class="col-6 text-muted">Mức giảm:</div>
                        <div class="col-6 fw-semibold text-end text-danger">${discountText}</div>
                        <div class="col-6 text-muted">Đơn hàng tối thiểu:</div>
                        <div class="col-6 fw-semibold text-end">${formatCurrency(item.minOrder)} ₫</div>
                        <div class="col-6 text-muted">Giảm tối đa:</div>
                        <div class="col-6 fw-semibold text-end">${item.maxDiscount ? formatCurrency(item.maxDiscount) + ' ₫' : 'Không giới hạn'}</div>
                        <div class="col-6 text-muted">Thời gian áp dụng:</div>
                        <div class="col-6 fw-semibold text-end">${formatDate(item.startDate)} - ${formatDate(item.endDate)}</div>
                        <div class="col-6 text-muted">Lượt đã dùng/Tối đa:</div>
                        <div class="col-6 fw-semibold text-end">${item.usedCount || 0} / ${item.usageLimit}</div>
                        <div class="col-6 text-muted">Đối tượng:</div>
                        <div class="col-6 fw-semibold text-end">${item.customerType || 'Tất cả'}</div>
                    </div>
                `;
            }
            bootstrap.Modal.getOrCreateInstance(document.getElementById('viewModal')).show();
        } else {
            showNotification('error', 'Lỗi', result.message || 'Không thể xem thông tin mã.');
        }
    } catch (error) {
        showNotification('error', 'Lỗi kết nối', 'Không thể lấy dữ liệu.');
    }
}

function confirmDelete(id) {
    showConfirmModal(
        'Xác nhận xóa',
        'Bạn có chắc chắn muốn xóa mã giảm giá này không? Thao tác này không thể hoàn tác.',
        () => deletePromoCode(id)
    );
}

async function deletePromoCode(id) {
    try {
        const response = await fetch(`/promo-codes/api/${id}`, { method: 'DELETE' }); //[cite: 1]
        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('success', 'Thành công', 'Đã xóa mã giảm giá thành công!', () => {
                const currentCardCount = document.querySelectorAll('#voucherList .col-md-6, #voucherList .col-lg-4').length;
                if (currentCardCount <= 1 && currentPage > 0) {
                    currentPage--;
                }
                loadPromoCodes(currentPage);
            });
        } else {
            showNotification('error', 'Xóa thất bại', result.message || 'Không thể xóa mã giảm giá này.');
        }
    } catch (error) {
        showNotification('error', 'Lỗi hệ thống', 'Có lỗi xảy ra khi thực hiện thao tác xóa.');
    }
}

// ==================== 7. HÀM ĐỊNH DẠNG ====================

function formatCurrency(amount) {
    if (amount === undefined || amount === null || amount === '') return '0';
    return Number(amount).toLocaleString('vi-VN');
}

function formatDate(dateStr) {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getStatusBadge(status) {
    switch (status) {
        case 'active':
            return '<span class="status-badge status-active"><i class="fa-solid fa-circle fs-6"></i> Đang hoạt động</span>';
        case 'upcoming':
            return '<span class="status-badge status-upcoming"><i class="fa-solid fa-clock fs-6"></i> Sắp diễn ra</span>';
        case 'expired':
            return '<span class="status-badge status-expired"><i class="fa-solid fa-circle-xmark fs-6"></i> Đã hết hạn</span>';
        default:
            return '';
    }
}