// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus(); // Cập nhật trạng thái đăng nhập
    loadUserProfile();
    loadUserOrders();
});

function loadUserProfile() {
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
    
    // Update wallet balance
    const balance = parseInt(localStorage.getItem('userBalance_' + currentUser.email) || '0');
    document.querySelector('.user-balance').textContent = formatPrice(balance);
    document.getElementById('walletBalanceDisplay').textContent = formatPrice(balance);
    document.querySelector('.menu-badge').textContent = formatPrice(balance);
}

function loadUserOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = orders.filter(order => order.customerId === currentUser.email);
    
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (userOrders.length === 0) {
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
            ${userOrders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Đơn hàng #${order.id}</strong>
                            <span class="order-date">${formatDate(order.date)}</span>
                        </div>
                        <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="order-item-info">
                                    <strong>${item.name}</strong>
                                    <span>x${item.quantity}</span>
                                </div>
                                <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-footer">
                        <span>Tổng cộng:</span>
                        <strong>${formatPrice(order.total)}</strong>
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
            
            .order-items {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 15px;
            }
            
            .order-item {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .order-item img {
                width: 50px;
                height: 50px;
                border-radius: 8px;
                background: white;
                padding: 5px;
                object-fit: contain;
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

function saveProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const profileData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        birthday: document.getElementById('birthday').value,
        address: document.getElementById('address').value
    };
    
    localStorage.setItem('profileData_' + currentUser.email, JSON.stringify(profileData));
    alert('Lưu thông tin thành công!');
}

// Add event listener for save button
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.querySelector('.btn-save-profile');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
});

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
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
