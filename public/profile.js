// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus(); // Cập nhật trạng thái đăng nhập
    loadUserProfile();
    loadUserOrders();
});

async function loadUserProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'index.html';
        return;
    }
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.name || currentUser.email.split('@')[0];
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('emailInput').value = currentUser.email;
    
    // Set initial
    const initial = (currentUser.name || currentUser.email).charAt(0).toUpperCase();
    document.getElementById('userInitial').textContent = initial;
    
    // Load saved profile data
    const profileData = JSON.parse(localStorage.getItem('profileData_' + currentUser.email) || '{}');
    if (profileData.fullName) document.getElementById('fullName').value = profileData.fullName;
    if (profileData.phone) document.getElementById('phone').value = profileData.phone;
    if (profileData.birthday) document.getElementById('birthday').value = profileData.birthday;
    if (profileData.address) document.getElementById('address').value = profileData.address;
    
    // Load telegram_chat_id from currentUser
    if (currentUser.telegram_chat_id) {
        document.getElementById('telegramChatId').value = currentUser.telegram_chat_id;
    }
    
    // Load wallet balance from API
    try {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            const response = await fetch('/api/wallet', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const balance = data.data.balance || 0;
                document.querySelector('.user-balance').textContent = formatPrice(balance);
                document.getElementById('walletBalanceDisplay').textContent = formatPrice(balance);
                document.querySelector('.menu-badge').textContent = formatPrice(balance);
            }
        }
    } catch (error) {
        console.error('Failed to load wallet balance:', error);
        // Fallback to 0 if API fails
        document.querySelector('.user-balance').textContent = formatPrice(0);
        document.getElementById('walletBalanceDisplay').textContent = formatPrice(0);
        document.querySelector('.menu-badge').textContent = formatPrice(0);
    }
}

async function loadUserOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        
        const data = await response.json();
        const orders = data.data || [];
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>Chưa có đơn hàng</h3>
                    <p>Bạn chưa có đơn hàng nào</p>
                    <button class="btn-save-profile" onclick="window.location.href='products.html'" style="margin: 20px auto 0;">
                        <i class="fas fa-shopping-bag"></i>
                        Mua sắm ngay
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="orders-list">
                ${orders.map(order => `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <strong>Đơn hàng #${order.order_code || order.id}</strong>
                                <span class="order-date">${formatDate(order.created_at)}</span>
                            </div>
                            <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                        </div>
                        <div class="order-items">
                            ${(order.order_items || []).map(item => `
                                <div class="order-item">
                                    <div class="order-item-info">
                                        <strong>${item.product_name}</strong>
                                        <span>x${item.quantity}</span>
                                        ${item.accounts ? `
                                            <div style="margin-top: 8px; padding: 10px; background: #e8f5e9; border-radius: 6px;">
                                                <p style="margin: 0; font-size: 13px; color: #2e7d32;">
                                                    <strong>Tài khoản:</strong> ${item.accounts.username}
                                                </p>
                                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #2e7d32;">
                                                    <strong>Mật khẩu:</strong> ${item.accounts.password}
                                                </p>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="order-item-price">${formatPrice(item.product_price * item.quantity)}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-footer">
                            <span>Tổng cộng:</span>
                            <strong>${formatPrice(order.total || order.total_amount)}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <style>
                .orders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .order-card {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 20px;
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .order-header strong {
                    display: block;
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .order-date {
                    font-size: 13px;
                    color: #666;
                }
                
                .status-badge {
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .status-completed {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                
                .status-pending {
                    background: #fff3e0;
                    color: #f57c00;
                }
                
                .status-cancelled {
                    background: #ffebee;
                    color: #c62828;
                }
                
                .order-items {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 15px;
                }
                
                .order-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    background: white;
                    border-radius: 8px;
                }
                
                .order-item-info {
                    flex: 1;
                }
                
                .order-item-info strong {
                    display: block;
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 3px;
                }
                
                .order-item-info span {
                    font-size: 13px;
                    color: #666;
                }
                
                .order-item-price {
                    font-size: 15px;
                    font-weight: 700;
                    color: #667eea;
                }
                
                .order-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px solid #e0e0e0;
                }
                
                .order-footer span {
                    font-size: 14px;
                    color: #666;
                }
                
                .order-footer strong {
                    font-size: 18px;
                    color: #667eea;
                }
            </style>
        `;
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Không thể tải đơn hàng</h3>
                <p>Vui lòng thử lại sau</p>
            </div>
        `;
    }
}

function showProfileSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.profile-content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item').classList.add('active');
}

async function saveProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const profileData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        birthday: document.getElementById('birthday').value,
        address: document.getElementById('address').value
    };
    
    localStorage.setItem('profileData_' + currentUser.email, JSON.stringify(profileData));
    
    // Update Telegram Chat ID via API
    const telegramChatId = document.getElementById('telegramChatId').value.trim();
    if (telegramChatId) {
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/update-telegram', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegram_chat_id: telegramChatId })
            });
            
            const data = await response.json();
            if (data.success) {
                // Update currentUser in localStorage
                currentUser.telegram_chat_id = telegramChatId;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert('✅ Lưu thông tin thành công! Bạn sẽ nhận thông báo qua Telegram.');
            } else {
                alert('⚠️ Lưu thông tin cơ bản thành công, nhưng không thể cập nhật Telegram Chat ID: ' + data.message);
            }
        } catch (error) {
            console.error('Failed to update telegram chat id:', error);
            alert('⚠️ Lưu thông tin cơ bản thành công, nhưng không thể cập nhật Telegram Chat ID');
        }
    } else {
        alert('✅ Lưu thông tin thành công!');
    }
}

function showTelegramGuide() {
    document.getElementById('telegramGuideModal').style.display = 'flex';
}

function closeTelegramGuide() {
    document.getElementById('telegramGuideModal').style.display = 'none';
}

// Add event listener for save button
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.querySelector('.btn-save-profile');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
});

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN');
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Chờ xử lý',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statuses[status] || status;
}


// Change password functions
let otpSent = false;
let otpTimer = null;

function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'flex';
    otpSent = false;
    document.getElementById('otpSection').style.display = 'none';
    document.getElementById('requestOtpBtn').style.display = 'block';
    document.getElementById('changePasswordSubmitBtn').style.display = 'none';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
    otpSent = false;
    if (otpTimer) clearInterval(otpTimer);
}

async function requestOTP() {
    const currentPassword = document.getElementById('currentPassword').value;
    
    if (!currentPassword) {
        alert('❌ Vui lòng nhập mật khẩu hiện tại!');
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/request-password-otp', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            otpSent = true;
            
            // Show OTP input section
            document.getElementById('otpSection').style.display = 'block';
            document.getElementById('requestOtpBtn').style.display = 'none';
            document.getElementById('changePasswordSubmitBtn').style.display = 'block';
            
            // Start countdown timer (5 minutes)
            let timeLeft = 300; // 5 minutes in seconds
            const timerDisplay = document.getElementById('otpTimer');
            
            otpTimer = setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(otpTimer);
                    timerDisplay.textContent = 'Hết hạn';
                    alert('⚠️ Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
                }
            }, 1000);
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Request OTP error:', error);
        alert('❌ Có lỗi xảy ra khi gửi mã OTP');
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    if (!otpSent) {
        alert('❌ Vui lòng yêu cầu mã OTP trước!');
        return;
    }
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const otp = document.getElementById('otpCode').value;
    
    if (newPassword !== confirmNewPassword) {
        alert('❌ Mật khẩu mới không khớp!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('❌ Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
    }
    
    if (!otp || otp.length !== 6) {
        alert('❌ Vui lòng nhập mã OTP 6 số!');
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/change-password-auth', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                otp
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            closeChangePasswordModal();
            if (otpTimer) clearInterval(otpTimer);
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Change password error:', error);
        alert('❌ Có lỗi xảy ra khi đổi mật khẩu');
    }
}
