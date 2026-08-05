document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const API_BASE = "/api/categories";

  let state = {
    keyword: "",
    page: 0,
    size: 8,
    sortBy: "name",
    sortDir: "asc",
    categories: []
  };

  const tableBody = document.getElementById("categoryTableBody");
  const searchInput = document.getElementById("searchInput");
  const paginationInfo = document.getElementById("paginationInfo");
  const paginationBtns = document.getElementById("paginationBtns");

  const categoryModalEl = document.getElementById("addCategoryModal");
  const categoryModal = categoryModalEl ? new bootstrap.Modal(categoryModalEl) : null;
  const categoryForm = document.getElementById("categoryForm");
  const modalTitle = document.getElementById("categoryModalTitle");
  const catId = document.getElementById("categoryId");
  const catName = document.getElementById("categoryName");
  const catDesc = document.getElementById("categoryDesc");
  const catAgeRating = document.getElementById("categoryAgeRating");

  const ageModalEl = document.getElementById("addAgeModal");
  const ageCodeInput = document.getElementById("ageCode");
  const modalAgeList = document.getElementById("modalAgeList");

  // Hiển thị Modal Thông Báo Thành Công
  function showSuccessModal(message, title = "Thành công!") {
    return new Promise((resolve) => {
      const modalEl = document.getElementById("successModal");
      if (!modalEl) {
        alert(message);
        resolve();
        return;
      }

      const titleEl = document.getElementById("successModalTitle");
      const msgEl = document.getElementById("successModalMessage");

      if (titleEl) titleEl.innerText = title;
      if (msgEl) msgEl.innerText = message;

      const modal = new bootstrap.Modal(modalEl);

      modalEl.addEventListener("hidden.bs.modal", function onHidden() {
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        resolve();
      });

      modal.show();
    });
  }

  // Hiển thị Modal Báo Lỗi Cụ Thể (Tự động khởi tạo nếu chưa có HTML)
  function showErrorModal(message, title = "Thao tác không thành công!") {
    return new Promise((resolve) => {
      let modalEl = document.getElementById("appErrorModal");

      if (!modalEl) {
        const modalHtml = `
        <div class="modal fade" id="appErrorModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
                    <div class="modal-body text-center p-4">
                        <div class="mb-3 text-danger">
                            <i class="fa-solid fa-triangle-exclamation display-4"></i>
                        </div>
                        <h5 class="fw-bold mb-2 text-dark modal-title-text">${escapeHtml(title)}</h5>
                        <p class="text-muted small mb-4 modal-message-text">${escapeHtml(message)}</p>
                        <div class="d-flex justify-content-center">
                            <button type="button" class="btn btn-danger px-4 rounded-pill fw-semibold shadow-sm" data-bs-dismiss="modal">
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        modalEl = document.getElementById("appErrorModal");
      } else {
        const titleEl = modalEl.querySelector(".modal-title-text");
        const msgEl = modalEl.querySelector(".modal-message-text");
        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;
      }

      const modal = new bootstrap.Modal(modalEl);

      modalEl.addEventListener("hidden.bs.modal", function onHidden() {
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        resolve();
      });

      modal.show();
    });
  }

  // Hiển thị Toast lỗi nhanh
  function showErrorToast(message) {
    let toastZone = document.getElementById("toastZone");
    if (!toastZone) {
      toastZone = document.createElement("div");
      toastZone.id = "toastZone";
      toastZone.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999;";
      document.body.appendChild(toastZone);
    }

    const id = "toast_" + Date.now();
    const html = `
      <div id="${id}" class="toast align-items-center bg-danger text-white border-0 mb-2 shadow" role="alert">
        <div class="d-flex">
          <div class="toast-body fw-bold">${escapeHtml(message)}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;

    toastZone.insertAdjacentHTML("beforeend", html);
    const el = document.getElementById(id);
    const t = new bootstrap.Toast(el, { delay: 3500 });
    t.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  }

  // Hiển thị Modal Confirm
  function showConfirm(message, title = "Xác nhận thao tác") {
    return new Promise((resolve) => {
      const modalEl = document.getElementById("confirmModal");
      if (!modalEl) {
        resolve(window.confirm(message));
        return;
      }

      const titleEl = document.getElementById("confirmModalTitle");
      const msgEl = document.getElementById("confirmModalMessage");
      const okBtn = document.getElementById("confirmModalOkBtn");

      if (titleEl) titleEl.innerText = title;
      if (msgEl) msgEl.innerText = message;

      const modal = new bootstrap.Modal(modalEl);
      let isConfirmed = false;

      okBtn.onclick = () => {
        isConfirmed = true;
        modal.hide();
      };

      modalEl.addEventListener("hidden.bs.modal", function onHidden() {
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        resolve(isConfirmed);
      });

      modal.show();
    });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  async function loadCategories() {
    try {
      const params = new URLSearchParams({
        keyword: state.keyword,
        page: state.page,
        size: state.size,
        sortBy: state.sortBy,
        sortDir: state.sortDir
      });

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error("Lỗi khi tải danh sách danh mục!");

      const pageData = await res.json();
      state.categories = pageData.content || [];
      renderTable(state.categories);
      renderPagination(pageData);
    } catch (err) {
      showErrorToast(err.message);
    }
  }

  function renderTable(categories) {
    if (!tableBody) return;

    if (categories.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Không tìm thấy danh mục nào</td></tr>`;
      return;
    }

    const startIdx = state.page * state.size;
    tableBody.innerHTML = categories.map((c, index) => `
      <tr data-id="${c.id}">
        <td class="fw-bold">${startIdx + index + 1}</td>
        <td class="fw-semibold cat-name-col">
          <a href="javascript:void(0)"
             onclick="openViewModal('${c.id}')"
             class="text-primary text-decoration-none hover-underline"
             title="Bấm để xem danh sách phim">
            ${escapeHtml(c.name)}
          </a>
        </td>
        <td class="text-muted small cat-desc-col">${escapeHtml(c.description || "—")}</td>
        <td class="text-center">
          <span class="badge bg-info text-dark px-3 py-2 rounded-pill">
            🎬 ${c.count ?? c.movieCount ?? 0} phim
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-info me-1" onclick="openViewModal('${c.id}')" title="Chi tiết">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="openEditCategory('${c.id}')" title="Sửa">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${c.id}')" title="Xóa">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  function updateTableRow(id, updatedData) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    const nameCol = row.querySelector(".cat-name-col a");
    const descCol = row.querySelector(".cat-desc-col");

    if (nameCol) nameCol.textContent = updatedData.name;
    if (descCol) descCol.textContent = updatedData.description || "—";

    row.classList.add("table-success");
    setTimeout(() => row.classList.remove("table-success"), 1500);
  }

  function renderPagination(pageData) {
    const total = pageData.totalElements || 0;
    const totalPages = pageData.totalPages || 1;
    const current = pageData.number || 0;

    if (paginationInfo) {
      const start = total === 0 ? 0 : current * state.size + 1;
      const end = Math.min((current + 1) * state.size, total);
      paginationInfo.textContent = `Hiển thị ${start} – ${end} / ${total} danh mục`;
    }

    if (!paginationBtns) return;

    let btnsHtml = "";
    btnsHtml += `<button class="btn btn-sm btn-outline-secondary ${current === 0 ? 'disabled' : ''}" onclick="changePage(${current - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

    for (let p = 0; p < totalPages; p++) {
      btnsHtml += `<button class="btn btn-sm ${p === current ? 'btn-primary' : 'btn-outline-secondary'}" onclick="changePage(${p})">${p + 1}</button>`;
    }

    btnsHtml += `<button class="btn btn-sm btn-outline-secondary ${current >= totalPages - 1 ? 'disabled' : ''}" onclick="changePage(${current + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    paginationBtns.innerHTML = btnsHtml;
  }

  window.openAddCategoryModal = function () {
    if (categoryForm) categoryForm.reset();
    if (catId) catId.value = "";
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-square-plus me-2"></i>Thêm Danh Mục Mới`;
  };

  window.openEditCategory = async function (id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Không thể lấy thông tin danh mục!");
      const data = await res.json();

      if (catId) catId.value = data.id;
      if (catName) catName.value = data.name;
      if (catDesc) catDesc.value = data.description || "";
      if (catAgeRating && data.ageRatingId) catAgeRating.value = data.ageRatingId;

      if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square me-2"></i>Sửa Danh Mục`;
      if (categoryModal) categoryModal.show();
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  window.saveCategory = async function (e) {
    if (e) e.preventDefault();

    if (!catName || !catName.value.trim()) {
      showErrorToast("Tên danh mục không được để trống!");
      return;
    }

    const submitBtn = categoryForm ? categoryForm.querySelector('button[type="submit"]') : null;
    if (submitBtn && submitBtn.disabled) return;

    const id = catId ? catId.value : "";
    const isEdit = Boolean(id);

    const payload = {
      name: catName.value.trim(),
      description: catDesc ? catDesc.value.trim() : "",
      status: "active",
      ageRatingId: catAgeRating ? catAgeRating.value : null
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...`;
      }

      const url = isEdit ? `${API_BASE}/${id}` : API_BASE;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Lỗi khi lưu thông tin danh mục!");
      }

      const savedCategory = await res.json();
      if (categoryModal) categoryModal.hide();

      if (isEdit) {
        updateTableRow(id, savedCategory);
        await showSuccessModal("Cập nhật danh mục thành công!");
      } else {
        await showSuccessModal("Thêm danh mục mới thành công!");
        loadCategories();
      }
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitBtn.dataset.originalText) {
          submitBtn.innerHTML = submitBtn.dataset.originalText;
        }
      }
    }
  };

  // Hàm Xóa Danh Mục với khả năng Bắt Lỗi và Bật Modal Lỗi Cụ Thể
  window.deleteCategory = async function (id) {
      const category = state.categories.find(c => c.id === id);
      const catNameStr = category ? category.name : "danh mục này";

      const isConfirmed = await showConfirm(
        `Bạn có chắc chắn muốn xóa danh mục "${catNameStr}" không?`,
        "Xác nhận xóa danh mục"
      );

      if (!isConfirmed) return;

      try {
        const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });

        if (!res.ok) {
          let serverMessage = "Không thể xóa danh mục này!";
          try {
            const errData = await res.json();
            //  Đọc errData.detail (Spring Boot 3) rồi tới errData.message
            serverMessage = errData.detail || errData.message || errData.reason || serverMessage;
          } catch (e) {
            const textErr = await res.text();
            if (textErr) serverMessage = textErr;
          }
          throw new Error(serverMessage);
        }

        await showSuccessModal("Xóa danh mục thành công!");
        loadCategories();
      } catch (err) {
        showErrorModal(err.message, "Không thể xóa danh mục");
      }
    };

  window.openViewModal = window.viewDetail = async function (categoryId) {
    try {
      const [resCat, resMovies] = await Promise.all([
        fetch(`/api/categories/${categoryId}`),
        fetch(`/api/categories/${categoryId}/movies`)
      ]);

      if (!resCat.ok) throw new Error("Không thể tải thông tin danh mục!");

      const category = await resCat.json();
      const rawMovies = resMovies.ok ? await resMovies.json() : [];

      let movies = [];
      if (Array.isArray(rawMovies)) {
        movies = rawMovies;
      } else if (rawMovies && Array.isArray(rawMovies.content)) {
        movies = rawMovies.content;
      }

      const detailTitle = document.getElementById("detailTitle");
      const detailName = document.getElementById("detailName");
      const detailDesc = document.getElementById("detailDesc");
      const detailMovieCount = document.getElementById("detailMovieCount");

      if (detailTitle) detailTitle.innerHTML = `<i class="fa-solid fa-circle-info me-2"></i> ${escapeHtml(category.name)}`;
      if (detailName) detailName.innerText = category.name;
      if (detailDesc) detailDesc.innerText = category.description || "Chưa có mô tả cho danh mục này.";
      if (detailMovieCount) detailMovieCount.innerText = `${movies.length} phim`;

      const movieListContainer = document.getElementById("detailMovieList");
      if (movieListContainer) {
        movieListContainer.innerHTML = "";

        if (movies.length === 0) {
          movieListContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
              <i class="fa-solid fa-film fs-1 d-block mb-2 opacity-50"></i>
              Chưa có phim nào thuộc danh mục này
            </div>
          `;
        } else {
          movies.forEach(movie => {
            const releaseYear = movie.releaseDate
              ? new Date(movie.releaseDate).getFullYear()
              : (movie.createdAt ? new Date(movie.createdAt).getFullYear() : "—");

            const posterUrl = movie.posterUrl || "https://placehold.co/48x60/8a2be2/ffffff?text=🎬";
            const ageBadge = movie.ageRating || "P";

            const movieHtml = `
              <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded-3 border shadow-sm">
                <div class="d-flex align-items-center gap-3">
                  <img src="${posterUrl}"
                       alt="${escapeHtml(movie.title)}"
                       class="rounded-2 shadow-sm"
                       style="width: 48px; height: 60px; object-fit: cover;"
                       onerror="this.src='https://placehold.co/48x60/8a2be2/ffffff?text=🎬'">
                  <div>
                    <h6 class="fw-bold mb-1 text-dark" style="font-size: 0.95rem;">${escapeHtml(movie.title)}</h6>
                    <small class="text-muted">${releaseYear}</small>
                  </div>
                </div>
                <span class="badge bg-warning text-dark px-2 py-1 rounded-2 fw-bold" style="font-size: 0.8rem;">
                  ${ageBadge}
                </span>
              </div>
            `;
            movieListContainer.insertAdjacentHTML("beforeend", movieHtml);
          });
        }
      }

      const editBtn = document.getElementById("detailEditBtn");
      if (editBtn) {
        editBtn.onclick = () => {
          const modalEl = document.getElementById("detailCategoryModal");
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();

          if (typeof window.openEditCategory === "function") {
            window.openEditCategory(categoryId);
          }
        };
      }

      const modalEl = document.getElementById("detailCategoryModal");
      if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }

    } catch (err) {
      console.error("Lỗi xem chi tiết danh mục:", err);
      showErrorToast(err.message);
    }
  };

  let searchTimer;
  window.handleSearch = function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.keyword = searchInput ? searchInput.value.trim() : "";
      state.page = 0;
      loadCategories();
    }, 300);
  };

  window.changePage = function (p) {
    state.page = p;
    loadCategories();
  };

  async function loadAgeRatings() {
    try {
      const res = await fetch(`${API_BASE}/age-ratings`);
      if (!res.ok) return;
      const data = await res.json();

      if (modalAgeList) {
        if (data.length === 0) {
          modalAgeList.innerHTML = `<small class="text-muted d-block text-center py-2">Chưa có phân loại độ tuổi nào</small>`;
          return;
        }
        modalAgeList.innerHTML = data.map(age => `
          <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded border">
            <span class="fw-bold text-dark">${escapeHtml(age.code)}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteAge('${age.id}')" title="Xóa"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("");
      }
    } catch (err) {
      console.error("Lỗi tải độ tuổi:", err);
    }
  }

  window.addAge = async function () {
    const code = ageCodeInput ? ageCodeInput.value.trim() : "";
    if (!code) {
      showErrorToast("Vui lòng nhập mã độ tuổi!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/age-ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, description: "" })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Thêm độ tuổi thất bại!");
      }

      await showSuccessModal("Thêm độ tuổi thành công!");
      if (ageCodeInput) ageCodeInput.value = "";
      loadAgeRatings();
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  window.deleteAge = async function (id) {
    const isConfirmed = await showConfirm(
      "Bạn có chắc muốn xóa phân loại độ tuổi này?",
      "Xác nhận xóa độ tuổi"
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/age-ratings/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể xóa độ tuổi này!");
      }

      await showSuccessModal("Xóa độ tuổi thành công!");
      loadAgeRatings();
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  if (categoryForm) {
    categoryForm.addEventListener("submit", window.saveCategory);
  }

  if (ageModalEl) {
    ageModalEl.addEventListener("show.bs.modal", loadAgeRatings);
  }

  loadCategories();
});