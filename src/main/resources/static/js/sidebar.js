document.addEventListener("DOMContentLoaded", function () {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
        const user = JSON.parse(savedUser);

        // Cập nhật tên và vai trò
        const nameEl = document.getElementById('sidebarUserName');
        const roleEl = document.getElementById('sidebarUserRole');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.textContent = user.username;
        if (roleEl) roleEl.textContent = user.role;

        // Tạo Avatar ngẫu nhiên theo tên
        if (avatarEl) {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D6EFD&color=fff&bold=true`;
        }
    } else {
        // Nếu chưa đăng nhập mà truy cập trang chức năng -> Ép quay về /login
        if (window.location.pathname !== '/login') {
            window.location.href = "/login";
        }
    }
});