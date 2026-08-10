let currentPage = 0;
    const pageSize = 10;
    let searchTimeout = null;

    document.addEventListener("DOMContentLoaded", () => {
        loadCustomers(0);
    });

    // Lấy danh sách khách hàng từ API Backend
    async function loadCustomers(page = 0) {
        currentPage = page;
        const keyword = document.getElementById("searchInput").value.trim();
        const url = `/api/customers?page=${page}&size=${pageSize}&keyword=${encodeURIComponent(keyword)}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Lỗi tải danh sách khách hàng");
            const data = await res.json();

            renderCustomerTable(data.content, page);
            renderPagination(data);
            document.getElementById("totalCount").innerText = `Tổng: ${data.totalElements} khách hàng`;
        } catch (err) {
            console.error(err);
        }
    }

    // Hiển thị dữ liệu lên bảng
    function renderCustomerTable(customers, page) {
        const tbody = document.getElementById("customerTableBody");
        if (!customers || customers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Không tìm thấy khách hàng nào</td></tr>`;
            return;
        }

        tbody.innerHTML = customers.map((c, index) => `
            <tr>
                <td>${page * pageSize + index + 1}</td>
                <td class="fw-bold">${c.name}</td>
                <td>${c.phone || "N/A"}</td>
                <td>${c.createdAt || "N/A"}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Xem thông tin" onclick="viewCustomerInfo('${c.id}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-purple" title="Lịch sử giao dịch" onclick="viewCustomerHistory('${c.id}', '${c.name}')">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // Phân trang
    function renderPagination(data) {
        const pagination = document.getElementById("pagination");
        let html = "";

        if (data.totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }

        for (let i = 0; i < data.totalPages; i++) {
            html += `
                <li class="page-item ${i === data.pageNo ? 'active' : ''}">
                    <button class="page-link" onclick="loadCustomers(${i})">${i + 1}</button>
                </li>
            `;
        }
        pagination.innerHTML = html;
    }

    // Xử lý ô tìm kiếm
    function handleSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadCustomers(0);
        }, 300);
    }

    // Xem chi tiết thông tin khách hàng
    async function viewCustomerInfo(id) {
        try {
            const res = await fetch(`/api/customers/${id}`);
            if (!res.ok) throw new Error("Không thể lấy thông tin");
            const c = await res.json();

            document.getElementById("infoContent").innerHTML = `
                <div class="mb-3"><strong>Mã KH:</strong> ${c.id}</div>
                <div class="mb-3"><strong>Họ và tên:</strong> ${c.name}</div>
                <div class="mb-3"><strong>Số điện thoại:</strong> ${c.phone || "Chưa cập nhật"}</div>
                <div class="mb-3"><strong>Email:</strong> ${c.email || "Chưa cập nhật"}</div>
                <div class="mb-0"><strong>Ngày tạo tài khoản:</strong> ${c.createdAt || "N/A"}</div>
            `;
            new bootstrap.Modal(document.getElementById("infoModal")).show();
        } catch (err) {
            alert(err.message);
        }
    }

    // Xem lịch sử giao dịch
    async function viewCustomerHistory(id, name) {
        document.getElementById("historyCustomerName").innerText = `Khách hàng: ${name} (ID: ${id})`;
        const tbody = document.getElementById("txTableBody");
        const emptyState = document.getElementById("txEmpty");
        const tableContainer = document.getElementById("txTableContainer");

        try {
            const res = await fetch(`/api/customers/${id}/history`);
            if (!res.ok) throw new Error("Không thể tải lịch sử giao dịch");
            const history = await res.json();

            if (!history || history.length === 0) {
                tableContainer.classList.add("d-none");
                emptyState.classList.remove("d-none");
            } else {
                tableContainer.classList.remove("d-none");
                emptyState.classList.add("d-none");

                tbody.innerHTML = history.map(tx => `
                    <tr>
                        <td class="fw-bold">${tx.bookingCode}</td>
                        <td>${tx.transactionDate || "N/A"}</td>
                        <td>${tx.movieName}</td>
                        <td>${tx.roomName}</td>
                        <td><span class="badge bg-light text-dark">${tx.seats}</span></td>
                        <td class="fw-bold text-success">${Number(tx.totalAmount).toLocaleString('vi-VN')} đ</td>
                        <td><span class="badge ${tx.status === 'PAID' ? 'bg-success' : 'bg-secondary'}">${tx.status}</span></td>
                    </tr>
                `).join("");
            }
            new bootstrap.Modal(document.getElementById("historyModal")).show();
        } catch (err) {
            alert(err.message);
        }
    }