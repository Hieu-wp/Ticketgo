// Biến toàn cục lưu lại nút Sửa đang được bấm
let currentEditButton = null;


// 1. CÁC HÀM HIỂN THỊ MODAL THÔNG BÁO / LỖI

function showAppModal(message, type = 'success', title = null) {
    return new Promise((resolve) => {
        const isError = type === 'error' || type === 'danger';
        const modalId = isError ? 'appErrorModal' : 'appSuccessModal';
        let modalEl = document.getElementById(modalId);

        if (!modalEl) {
            const iconClass = isError
                ? 'fa-solid fa-circle-xmark text-danger'
                : 'fa-solid fa-circle-check text-success';
            const defaultTitle = isError ? 'Đã xảy ra lỗi' : 'Thành công!';
            const btnClass = isError ? 'btn-danger' : 'btn-success';

            const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3">
                                <i class="${iconClass} display-3 opacity-75"></i>
                            </div>
                            <h5 class="fw-bold mb-2 text-dark modal-title-text">${title || defaultTitle}</h5>
                            <p class="text-muted small mb-4 modal-message-text">${message}</p>
                            <div class="d-flex justify-content-center">
                                <button type="button" class="btn ${btnClass} px-4 rounded-pill fw-semibold shadow-sm" data-bs-dismiss="modal">
                                    Đồng ý
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modalEl = document.getElementById(modalId);
        } else {
            const titleEl = modalEl.querySelector('.modal-title-text') || modalEl.querySelector('#successModalTitle') || modalEl.querySelector('#errorModalTitle');
            const msgEl = modalEl.querySelector('.modal-message-text') || modalEl.querySelector('#successModalMessage') || modalEl.querySelector('#errorModalMessage');

            if (titleEl) titleEl.textContent = title || (isError ? 'Đã xảy ra lỗi' : 'Thành công!');
            if (msgEl) msgEl.textContent = message;
        }

        const modalInstance = new bootstrap.Modal(modalEl);

        modalEl.addEventListener('hidden.bs.modal', function onHidden() {
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
            resolve();
        });

        modalInstance.show();
    });
}

function showSuccessModal(message, title = 'Thành công!') {
    return showAppModal(message, 'success', title);
}

function showErrorModal(message, title = 'Có lỗi xảy ra!') {
    return showAppModal(message, 'error', title);
}


// 2. CHUYỂN ĐỔI GIAO DIỆN (DANH SÁCH / THÊM / SỬA)

function showView(viewName) {
    const listView = document.getElementById('view-list');
    const configView = document.getElementById('view-config');
    const editForm = document.getElementById('editFilmForm');

    if (viewName === 'list') {
        if (listView) listView.style.display = 'block';
        if (configView) configView.style.display = 'none';
        if (editForm) editForm.style.display = 'none';
    } else if (viewName === 'config') {
        if (listView) listView.style.display = 'none';
        if (configView) configView.style.display = 'block';
        if (editForm) editForm.style.display = 'none';
    } else if (viewName === 'edit') {
        if (listView) listView.style.display = 'none';
        if (configView) configView.style.display = 'none';
        if (editForm) editForm.style.display = 'block';
    }
}


// 3. HÀM PREVIEW ẢNH KHI UPLOAD

function previewLocalFile(input) {
    const imgElement = document.getElementById('img-render');
    const placeholderText = document.getElementById('placeholder-text');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (imgElement) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
            }
            if (placeholderText) placeholderText.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        if (imgElement) {
            imgElement.src = '';
            imgElement.style.display = 'none';
        }
        if (placeholderText) placeholderText.style.display = 'block';
    }
}

function previewLocalBanner(input) {
    const imgElement = document.getElementById('banner-render');
    const placeholderText = document.getElementById('banner-placeholder-text');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (imgElement) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
            }
            if (placeholderText) placeholderText.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        if (imgElement) {
            imgElement.src = '';
            imgElement.style.display = 'none';
        }
        if (placeholderText) placeholderText.style.display = 'block';
    }
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewBanner(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const bannerPreview = document.getElementById('bannerPreview');
            if (bannerPreview) bannerPreview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}


// 4. UPLOAD ẢNH LÊN SUPABASE

async function uploadToSupabaseStorage(file, folder = 'posters') {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage.from('movies').upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('movies').getPublicUrl(fileName);
    return urlData.publicUrl;
}


// 5. NẠP DROPDOWN DANH MỤC VÀ ĐỘ TUỔI ĐỘNG

function populateSelectOptions(selectIds, items, valueKey, labelFn) {
    selectIds.forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;

        const currentValue = selectEl.value;
        selectEl.innerHTML = '<option value="">-- Chọn --</option>';

        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item[valueKey];
            opt.textContent = labelFn ? labelFn(item) : item[valueKey];
            selectEl.appendChild(opt);
        });

        if (currentValue) selectEl.value = currentValue;
    });
}

async function loadDynamicDropdowns() {
    try {
        const catResponse = await fetch('/api/categories?size=100');
        if (catResponse.ok) {
            const pageData = await catResponse.json();
            const categories = pageData.content || pageData;
            populateSelectOptions(['add-category_id', 'edit-category_id'], categories, 'id', c => c.name);
        }

        const ageResponse = await fetch('/api/categories/age-ratings');
        if (ageResponse.ok) {
            const ageRatings = await ageResponse.json();
            populateSelectOptions(['add-ageRating', 'edit-ageRating'], ageRatings, 'code', a => `${a.code} ${a.description ? '(' + a.description + ')' : ''}`);
        }
    } catch (err) {
        console.error("Lỗi khi tải dữ liệu danh mục/độ tuổi:", err);
    }
}


// 6. MỞ FORM EDIT VÀ ĐỔ DỮ LIỆU ĐANG CÓ

function openEditForm(button) {
    currentEditButton = button;
    const ds = button.dataset;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('edit-id', ds.id);
    setVal('edit-title', ds.title);
    setVal('edit-category_id', ds.categoryId);
    setVal('edit-ageRating', ds.ageRating);
    setVal('edit-duration', ds.duration);
    setVal('edit-director', ds.director);
    setVal('edit-cast', ds.cast);
    setVal('edit-synopsis', ds.synopsis);

    const imgPreview = document.getElementById('imagePreview');
    if (imgPreview && ds.poster) imgPreview.src = ds.poster;

    const bannerPreview = document.getElementById('bannerPreview');
    if (bannerPreview && ds.banner) bannerPreview.src = ds.banner;

    showView('edit');
}


// 7. SỰ KIỆN KHI TRANG KHỞI TẠO (DOM CONTENT LOADED)

window.addEventListener('DOMContentLoaded', () => {

    loadDynamicDropdowns();


    // A. XỬ LÝ SUBMIT FORM THÊM PHIM MỚI

    const addForm = document.getElementById('addFilmForm');
    if (addForm) {
        addForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            try {
                const posterFileInput = document.getElementById('poster-file-input');
                const bannerFileInput = document.getElementById('banner-file-input');

                let posterUrl = "";
                let bannerUrl = "";

                if (posterFileInput && posterFileInput.files[0]) {
                    posterUrl = await uploadToSupabaseStorage(posterFileInput.files[0], 'posters');
                }
                if (bannerFileInput && bannerFileInput.files[0]) {
                    bannerUrl = await uploadToSupabaseStorage(bannerFileInput.files[0], 'banners');
                }

                const formData = new FormData(addForm);
                if (posterUrl) formData.set('poster_url', posterUrl);
                if (bannerUrl) formData.set('banner_url', bannerUrl);

                const response = await fetch('/films/add', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    await showSuccessModal('🎉 Thêm phim mới thành công!');
                    location.reload();
                } else {
                    const errText = await response.text();
                    showErrorModal('Lỗi thêm phim: ' + errText);
                }
            } catch (err) {
                console.error("Lỗi:", err);
                showErrorModal("Lỗi upload ảnh hoặc kết nối máy chủ: " + err.message);
            }
        });
    }


    //  XỬ LÝ SUBMIT FORM CHỈNH SỬA PHIM

    const editForm = document.getElementById('editFilmForm');
        if (editForm) {
            editForm.addEventListener('submit', async function(event) {
                event.preventDefault();

                try {
                    const formData = new FormData(editForm);
                    const posterFileInput = document.getElementById('imageUpload');
                    const bannerFileInput = document.getElementById('bannerUpload');

                    if (posterFileInput && posterFileInput.files[0]) {
                        const newPosterUrl = await uploadToSupabaseStorage(posterFileInput.files[0], 'posters');
                        formData.set('poster_url', newPosterUrl);
                    }
                    if (bannerFileInput && bannerFileInput.files[0]) {
                        const newBannerUrl = await uploadToSupabaseStorage(bannerFileInput.files[0], 'banners');
                        formData.set('banner_url', newBannerUrl);
                    }

                    const response = await fetch('/films/edit', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        let updatedFilm = null;
                        try {
                            updatedFilm = await response.json();
                        } catch (e) {}

                        const filmId = formData.get('id') || (updatedFilm ? updatedFilm.id : '');

                        // 1. Tìm đúng thẻ Card phim trên giao diện
                        let cardElement = document.getElementById(`film-card-${filmId}`);
                        if (!cardElement && currentEditButton) {
                            cardElement = currentEditButton.closest('.movie-card');
                        }

                        // 2. CẬP NHẬT DỮ LIỆU TỨC THÌ LÊN CARD PHIM
                        if (cardElement) {
                            // Tên phim
                            const titleVal = updatedFilm?.title || formData.get('title');
                            const titleEl = cardElement.querySelector('.movie-title');
                            if (titleEl) titleEl.textContent = titleVal;

                            // Tên Danh mục
                            const categorySelect = document.getElementById('edit-category_id');
                            let categoryName = updatedFilm?.categoryName || '';
                            if (!categoryName && categorySelect && categorySelect.selectedIndex >= 0) {
                                categoryName = categorySelect.options[categorySelect.selectedIndex].text;
                                if (categoryName.startsWith('--')) categoryName = '';
                            }
                            const pList = cardElement.querySelectorAll('p.text-muted');
                            if (pList.length > 0) {
                                const catSpan = pList[0].querySelectorAll('span')[1];
                                if (catSpan) catSpan.textContent = categoryName;
                            }

                            // Thời lượng
                            const durationVal = updatedFilm?.duration || formData.get('duration');
                            if (pList.length > 1) {
                                const durSpan = pList[1].querySelector('span.fw-bold') || pList[1].querySelectorAll('span')[1];
                                if (durSpan) durSpan.textContent = `${durationVal || 0} phút`;
                            }

                            // Poster ảnh
                            const cardImgEl = cardElement.querySelector('.movie-poster');
                            const previewImgEl = document.getElementById('imagePreview');
                            const finalPosterUrl = updatedFilm?.posterUrl || formData.get('poster_url') || (previewImgEl ? previewImgEl.src : '');
                            if (cardImgEl && finalPosterUrl) cardImgEl.src = finalPosterUrl;

                            // Đồng bộ lại Dataset cho nút Sửa để nếu mở lại vẫn giữ thông tin mới
                            const editBtn = currentEditButton || cardElement.querySelector('[onclick*="openEditForm"]');
                            if (editBtn) {
                                editBtn.setAttribute('data-id', filmId);
                                editBtn.setAttribute('data-title', titleVal || '');
                                editBtn.setAttribute('data-category-id', formData.get('category_id') || '');
                                editBtn.setAttribute('data-age-rating', formData.get('ageRating') || '');
                                editBtn.setAttribute('data-duration', durationVal || '');
                                editBtn.setAttribute('data-director', formData.get('director') || '');
                                editBtn.setAttribute('data-cast', formData.get('cast') || '');
                                editBtn.setAttribute('data-synopsis', formData.get('synopsis') || '');
                                if (finalPosterUrl) editBtn.setAttribute('data-poster', finalPosterUrl);
                            }
                        }

                        // 3. Quay về màn hình danh sách & Hiện popup thành công
                        showView('list');
                        await showSuccessModal('🎉 Cập nhật thông tin phim thành công!');

                    } else {
                        const errorText = await response.text();
                        showErrorModal(errorText || 'Có lỗi xảy ra từ máy chủ, không thể lưu dữ liệu!');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showErrorModal('Lỗi hệ thống khi lưu dữ liệu hoặc upload ảnh!');
                }
            });
        }

    // Kiểm tra URL Param nếu reload
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('updateSuccess') === 'true') {
        showSuccessModal('Cập nhật dữ liệu thành công!');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});