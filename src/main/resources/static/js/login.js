document.addEventListener('DOMContentLoaded', () => {
    // 1. Khai báo DOM Elements
    const authContainer = document.getElementById('authContainer');
    const toLoginBtn = document.getElementById('toLoginBtn');
    const toRegisterBtn = document.getElementById('toRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // 2. Chuyển đổi giao diện Form (Đăng nhập / Đăng ký)
    if (toLoginBtn && authContainer) {
        toLoginBtn.addEventListener('click', () => authContainer.classList.add('active'));
    }

    if (toRegisterBtn && authContainer) {
        toRegisterBtn.addEventListener('click', () => authContainer.classList.remove('active'));
    }

    // 3. Xử lý Đăng Nhập
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (!usernameInput?.value.trim() || !passwordInput?.value) {
                alert("Vui lòng điền đầy đủ email và mật khẩu!");
                return;
            }

            // Khai báo biến payload
            const payload = {
                username: usernameInput.value.trim(),
                password: passwordInput.value
            };

            try {
                if (submitBtn) submitBtn.disabled = true;

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

               if (response.ok) {
                   const result = await response.json();
                   localStorage.setItem('user', JSON.stringify({
                       username: result.username,
                       role: result.role
                   }));
                   window.location.href = "/film";
               } else {
                    const result = await response.json().catch(() => ({}));
                    alert(result.message || "Tài khoản hoặc mật khẩu không chính xác!");
                }
            } catch (err) {
                console.error("Lỗi đăng nhập:", err);
                alert("Lỗi kết nối máy chủ!");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // 4. Xử lý Đăng Ký
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('regEmail');
            const passwordInput = document.getElementById('regPassword');
            const confirmPasswordInput = document.getElementById('regConfirmPassword');
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            if (passwordInput.value !== confirmPasswordInput.value) {
                alert("Mật khẩu xác nhận không trùng khớp!");
                return;
            }

            // Khai báo biến payload
            const payload = {
                username: emailInput.value.trim(),
                password: passwordInput.value
            };

            try {
                if (submitBtn) submitBtn.disabled = true;

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert("Đăng ký thành công! Mời bạn đăng nhập.");
                    registerForm.reset();
                    if (toLoginBtn) toLoginBtn.click();
                } else {
                    const result = await response.json().catch(() => ({}));
                    alert(result.message || "Đăng ký thất bại!");
                }
            } catch (err) {
                console.error("Lỗi đăng ký:", err);
                alert("Lỗi kết nối máy chủ!");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});