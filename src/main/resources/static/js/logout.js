
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                await fetch('/api/auth/logout', {
                    method: 'POST'
                });
            } catch (err) {
                console.error('Lỗi khi gọi API đăng xuất:', err);
            } finally {
                // Xoá thông tin user đã lưu ở client (localStorage)
                localStorage.removeItem('user');
                // Chuyển về trang đăng nhập
                window.location.href = '/login';
            }
        });
    }
});