// Chuyển đổi hiển thị giữa danh sách phim và form thêm mới/chỉnh sửa.
function showView(viewName) {
    const listView = document.getElementById('view-list');
    const configView = document.getElementById('view-config');
    const editForm = document.getElementById('editFilmForm');

    if (viewName === 'list') {
        if (listView) listView.style.display = 'block';
        if (configView) configView.style.display = 'none';
        if (editForm) editForm.style.display = 'none';
    } else {
        if (listView) listView.style.display = 'none';
        if (configView) configView.style.display = 'block';
        if (editForm) editForm.style.display = 'none';
    }
}

// Xem trước ảnh poster khi chọn file trong form thêm mới.
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

// Xem trước ảnh banner khi chọn file trong form thêm mới.
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

// Xem trước ảnh poster khi chọn file trong form cập nhật.
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

// Xem trước ảnh banner khi chọn file trong form cập nhật.
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

// Upload file ảnh lên Supabase Storage và trả về đường dẫn Public URL đầy đủ.
async function uploadToSupabaseStorage(file, folder = 'posters') {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    // Tải ảnh lên Bucket 'movies' trên Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from('movies').upload(fileName, file);
    if (uploadError) throw uploadError;

    // Lấy link công khai (Public URL)
    const { data: urlData } = supabase.storage.from('movies').getPublicUrl(fileName);
    return urlData.publicUrl;
}

// Đổ dữ liệu chi tiết của phim được chọn vào các ô nhập liệu của form chỉnh sửa.
function openEditForm(button) {
    const form = document.getElementById('editFilmForm');
    if (!form) return;

    form.style.display = 'block';
    const listView = document.getElementById('view-list');
    const configView = document.getElementById('view-config');
    if (listView) listView.style.display = 'none';
    if (configView) configView.style.display = 'none';

    const setInputValue = (id, attr) => {
        const el = document.getElementById(id);
        if (el) el.value = button.getAttribute(attr) || '';
    };

    setInputValue('edit-id', 'data-id');
    setInputValue('edit-title', 'data-title');
    setInputValue('edit-genre', 'data-genre');
    setInputValue('edit-duration', 'data-duration');
    setInputValue('edit-rating', 'data-rating');
    setInputValue('edit-ageRating', 'data-age-rating');
    setInputValue('edit-releaseDate', 'data-release-date');
    setInputValue('edit-synopsis', 'data-synopsis');
    setInputValue('edit-director', 'data-director');
    setInputValue('edit-cast', 'data-cast');

    const isNowShowingEl = document.getElementById('edit-isNowShowing');
    if (isNowShowingEl) {
        isNowShowingEl.checked = button.getAttribute('data-is-now-showing') === 'true';
    }

    const posterUrl = button.getAttribute('data-poster');
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.src = posterUrl ? posterUrl : '/images/default-poster.jpg';
    }

    const bannerUrl = button.getAttribute('data-banner');
    const bannerPreview = document.getElementById('bannerPreview');
    if (bannerPreview) {
        bannerPreview.src = bannerUrl ? bannerUrl : '/images/default-banner.jpg';
    }
}


window.addEventListener('DOMContentLoaded', () => {


    // 1. XỬ LÝ SUBMIT FORM THÊM PHIM MỚI

    const addForm = document.getElementById('addFilmForm') || document.getElementById('form-add-film');
    if (addForm) {
        addForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            try {
                const posterFileInput = document.getElementById('posterInput') || addForm.querySelector('input[name="poster"]');
                const bannerFileInput = document.getElementById('bannerInput') || addForm.querySelector('input[name="banner"]');

                // Tải ảnh lên Supabase Storage nếu người dùng chọn file
                let posterUrl = "";
                let bannerUrl = "";

                if (posterFileInput && posterFileInput.files[0]) {
                    posterUrl = await uploadToSupabaseStorage(posterFileInput.files[0], 'posters');
                }
                if (bannerFileInput && bannerFileInput.files[0]) {
                    bannerUrl = await uploadToSupabaseStorage(bannerFileInput.files[0], 'banners');
                }

                // Chuẩn bị dữ liệu gửi lên máy chủ / Supabase DB
                const formData = new FormData(addForm);
                if (posterUrl) formData.set('poster_url', posterUrl);
                if (bannerUrl) formData.set('banner_url', bannerUrl);

                const response = await fetch('/films/add', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('🎉 Thêm phim mới thành công!');
                    location.reload();
                } else {
                    const errText = await response.text();
                    alert('Lỗi thêm phim: ' + errText);
                }
            } catch (err) {
                console.error("Lỗi:", err);
                alert("Lỗi upload ảnh hoặc kết nối máy chủ: " + err.message);
            }
        });
    }


    // 2. XỬ LÝ SUBMIT FORM CHỈNH SỬA PHIM

    const editForm = document.getElementById('editFilmForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            try {
                const formData = new FormData(editForm);
                const posterFileInput = editForm.querySelector('input[name="poster"]');
                const bannerFileInput = editForm.querySelector('input[name="banner"]');

                // Nếu chọn ảnh poster/banner mới thì upload lại lấy Public URL mới
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
                    showView('list');

                    const successModalEl = document.getElementById('successModal');
                    if (successModalEl) {
                        const successModal = new bootstrap.Modal(successModalEl);
                        successModal.show();
                    }

                    const filmId = formData.get('id');
                    const cardElement = document.getElementById(`film-card-${filmId}`);

                    if (cardElement) {
                        const titleEl = cardElement.querySelector('.movie-title');
                        if (titleEl) titleEl.textContent = formData.get('title');

                        const imgPreviewEl = document.getElementById('imagePreview');
                        const cardImgEl = cardElement.querySelector('.movie-poster');
                        if (imgPreviewEl && cardImgEl) {
                            cardImgEl.src = imgPreviewEl.src;
                        }

                        // Cập nhật lại các data-* attributes để phục vụ lần mở form sửa tiếp theo
                        const editBtn = cardElement.querySelector('[onclick*="openEditForm"]');
                        if (editBtn) {
                            editBtn.setAttribute('data-title', formData.get('title') || '');
                            editBtn.setAttribute('data-genre', formData.get('genre') || '');
                            editBtn.setAttribute('data-duration', formData.get('duration') || '');
                            editBtn.setAttribute('data-rating', formData.get('rating') || '');
                            editBtn.setAttribute('data-age-rating', formData.get('ageRating') || '');
                            editBtn.setAttribute('data-release-date', formData.get('releaseDate') || '');
                            editBtn.setAttribute('data-synopsis', formData.get('synopsis') || '');
                            editBtn.setAttribute('data-director', formData.get('director') || '');
                            editBtn.setAttribute('data-cast', formData.get('cast') || '');
                            editBtn.setAttribute('data-is-now-showing', editForm.querySelector('#edit-isNowShowing')?.checked ? 'true' : 'false');
                            if (imgPreviewEl) editBtn.setAttribute('data-poster', imgPreviewEl.src);
                        }
                    }
                } else {
                    const errorText = await response.text();
                    alert(errorText || 'Có lỗi xảy ra từ máy chủ, không thể lưu dữ liệu!');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Lỗi khi lưu dữ liệu hoặc upload ảnh!');
            }
        });
    }


    // 3. KIỂM TRA THÔNG BÁO TỪ URL QUERY PARAMS

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('updateSuccess') === 'true') {
        const successModalEl = document.getElementById('successModal');
        if (successModalEl) {
            const successModal = new bootstrap.Modal(successModalEl);
            successModal.show();
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});