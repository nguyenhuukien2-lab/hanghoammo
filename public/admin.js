// Admin Dashboard JavaScript

let products = [];
let orders = [];
let customers = [];
let notifications = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadDashboard();
    loadProducts();
    loadOrders();
    loadCustomers();
    loadNotifications();
    loadSettings();
});

// Load all data from localStorage
function loadData() {
    products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    orders = JSON.parse(localStorage.getItem('orders')) || [];
    customers = JSON.parse(localStorage.getItem('users')) || [];
    notifications = JSON.parse(localStorage.getItem('notifications')) || [];
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Quản lý sản phẩm',
        'orders': 'Quản lý đơn hàng',
        'customers': 'Quản lý khách hàng',
        'notifications': 'Quản lý thông báo',
        'settings': 'Cài đặt hệ thống'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
}

// Dashboard
function loadDashboard() {
    // Update stats
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalCustomers').textContent = customers.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
    
    // Load recent orders
    loadRecentOrders();
    
    // Load top products
    loadTopProducts();
}

function loadRecentOrders() {
    const tbody = document.getElementById('recentOrders');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có đơn hàng</td></tr>';
        return;
    }
    
    const recentOrders = orders.slice(-5).reverse();
    tbody.innerHTML = recentOrders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>Khách hàng</td>
            <td><strong>${formatPrice(order.total)}</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${formatDate(order.date)}</td>
        </tr>
    `).join('');
}

function loadTopProducts() {
    const container = document.getElementById('topProducts');
    const topProducts = products.sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
    
    if (topProducts.length === 0) {
        container.innerHTML = '<p class="text-center">Chưa có sản phẩm</p>';
        return;
    }
    
    container.innerHTML = topProducts.map(product => `
        <div class="top-product-item">
            <img src="${product.image}" alt="${product.name}">
            <div class="top-product-info">
                <h4>${product.name}</h4>
                <p>Đã bán: ${product.sold || 0} | ${formatPrice(product.price)}</p>
            </div>
        </div>
    `).join('');
}

// Products Management
function loadProducts() {
    const tbody = document.getElementById('productsTable');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có sản phẩm</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="product-img"></td>
            <td><strong>${product.name}</strong></td>
            <td>${getCategoryName(product.category)}</td>
            <td><strong>${formatPrice(product.price)}</strong></td>
            <td>${product.sold || 0}</td>
            <td><span class="badge badge-${product.badge?.toLowerCase() || 'new'}">${product.badge || 'NEW'}</span></td>
            <td>
                <button class="btn-primary btn-sm" onclick="editProduct('${product._id || product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteProduct('${product._id || product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterProducts() {
    const search = document.getElementById('searchProduct').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    
    let filtered = products;
    
    if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    }
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = filtered.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="product-img"></td>
            <td><strong>${product.name}</strong></td>
            <td>${getCategoryName(product.category)}</td>
            <td><strong>${formatPrice(product.price)}</strong></td>
            <td>${product.sold || 0}</td>
            <td><span class="badge badge-${product.badge?.toLowerCase() || 'new'}">${product.badge || 'NEW'}</span></td>
            <td>
                <button class="btn-primary btn-sm" onclick="editProduct('${product._id || product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteProduct('${product._id || product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    modal.classList.add('active');
    
    if (productId) {
        const product = products.find(p => (p._id || p.id) == productId);
        document.getElementById('productModalTitle').textContent = 'Chỉnh sửa sản phẩm';
        document.getElementById('editProductId').value = productId;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productSold').value = product.sold || 0;
        document.getElementById('productBadge').value = product.badge || 'NEW';
        document.getElementById('productImage').value = product.image;
    } else {
        document.getElementById('productModalTitle').textContent = 'Thêm sản phẩm mới';
        document.getElementById('editProductId').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productSold').value = '0';
        document.getElementById('productBadge').value = 'NEW';
        document.getElementById('productImage').value = '';
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function saveProduct() {
    const productId = document.getElementById('editProductId').value;
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const sold = parseInt(document.getElementById('productSold').value);
    const badge = document.getElementById('productBadge').value;
    const image = document.getElementById('productImage').value;
    
    if (!name || !price || !image) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    if (productId) {
        // Edit existing product
        const index = products.findIndex(p => (p._id || p.id) == productId);
        products[index] = {
            ...products[index],
            name,
            category,
            price,
            sold,
            badge,
            image
        };
    } else {
        // Add new product
        const newProduct = {
            _id: Date.now().toString(),
            id: Date.now(),
            name,
            category,
            price,
            sold,
            badge,
            image
        };
        products.push(newProduct);
    }
    
    localStorage.setItem('adminProducts', JSON.stringify(products));
    loadProducts();
    loadDashboard();
    closeProductModal();
    alert('Lưu sản phẩm thành công!');
}

function editProduct(productId) {
    openProductModal(productId);
}

function deleteProduct(productId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    products = products.filter(p => (p._id || p.id) != productId);
    localStorage.setItem('adminProducts', JSON.stringify(products));
    loadProducts();
    loadDashboard();
    alert('Xóa sản phẩm thành công!');
}

// Orders Management
function loadOrders() {
    const tbody = document.getElementById('ordersTable');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có đơn hàng</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>Khách hàng</td>
            <td>${order.items.length} sản phẩm</td>
            <td><strong>${formatPrice(order.total)}</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${formatDate(order.date)}</td>
            <td>
                <button class="btn-success btn-sm" onclick="updateOrderStatus('${order.id}', 'completed')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterOrders() {
    const search = document.getElementById('searchOrder').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    let filtered = orders;
    
    if (search) {
        filtered = filtered.filter(o => o.id.toLowerCase().includes(search));
    }
    
    if (status) {
        filtered = filtered.filter(o => o.status === status);
    }
    
    const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = filtered.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>Khách hàng</td>
            <td>${order.items.length} sản phẩm</td>
            <td><strong>${formatPrice(order.total)}</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${formatDate(order.date)}</td>
            <td>
                <button class="btn-success btn-sm" onclick="updateOrderStatus('${order.id}', 'completed')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        loadDashboard();
        alert('Cập nhật trạng thái thành công!');
    }
}

// Customers Management
function loadCustomers() {
    const tbody = document.getElementById('customersTable');
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có khách hàng</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(customer => {
        const customerOrders = orders.filter(o => o.customerId === customer.email);
        const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
        
        return `
            <tr>
                <td><strong>${customer.email}</strong></td>
                <td>${customer.name || 'N/A'}</td>
                <td>${customerOrders.length}</td>
                <td><strong>${formatPrice(totalSpent)}</strong></td>
                <td>${formatDate(customer.createdAt || new Date())}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="viewCustomer('${customer.email}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterCustomers() {
    const search = document.getElementById('searchCustomer').value.toLowerCase();
    let filtered = customers;
    
    if (search) {
        filtered = filtered.filter(c => 
            c.email.toLowerCase().includes(search) || 
            (c.name && c.name.toLowerCase().includes(search))
        );
    }
    
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = filtered.map(customer => {
        const customerOrders = orders.filter(o => o.customerId === customer.email);
        const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
        
        return `
            <tr>
                <td><strong>${customer.email}</strong></td>
                <td>${customer.name || 'N/A'}</td>
                <td>${customerOrders.length}</td>
                <td><strong>${formatPrice(totalSpent)}</strong></td>
                <td>${formatDate(customer.createdAt || new Date())}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="viewCustomer('${customer.email}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewCustomer(email) {
    alert('Xem chi tiết khách hàng: ' + email);
}

// Notifications Management
function loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (notifications.length === 0) {
        container.innerHTML = '<p class="text-center">Chưa có thông báo</p>';
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-card ${notif.type}">
            <div class="notification-content">
                <h4>${getNotificationTypeText(notif.type)}</h4>
                <p>${notif.content}</p>
            </div>
            <div class="notification-actions">
                <button class="btn-danger btn-sm" onclick="deleteNotification('${notif.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openNotificationModal() {
    document.getElementById('notificationModal').classList.add('active');
}

function closeNotificationModal() {
    document.getElementById('notificationModal').classList.remove('active');
}

function saveNotification() {
    const type = document.getElementById('notificationType').value;
    const content = document.getElementById('notificationContent').value;
    const active = document.getElementById('notificationActive').checked;
    
    if (!content) {
        alert('Vui lòng nhập nội dung thông báo!');
        return;
    }
    
    const newNotification = {
        id: Date.now().toString(),
        type,
        content,
        active,
        createdAt: new Date().toISOString()
    };
    
    notifications.push(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
    closeNotificationModal();
    alert('Thêm thông báo thành công!');
}

function deleteNotification(id) {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    
    notifications = notifications.filter(n => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
}

// Settings
function loadSettings() {
    const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
    const maintenanceMessage = localStorage.getItem('maintenanceMessage') || '';
    const maintenanceETA = localStorage.getItem('maintenanceETA') || '30 phút';
    const shopTelegram = localStorage.getItem('shopTelegram') || 'https://t.me/hanghoammo';
    
    document.getElementById('maintenanceMode').checked = maintenanceMode;
    document.getElementById('maintenanceMessage').value = maintenanceMessage;
    
    if (document.getElementById('maintenanceETA')) {
        document.getElementById('maintenanceETA').value = maintenanceETA;
    }
    
    if (document.getElementById('shopTelegram')) {
        document.getElementById('shopTelegram').value = shopTelegram;
    }
    
    // Load products for account upload
    loadProductsForAccounts();
}

function loadProductsForAccounts() {
    const select = document.getElementById('accountProductSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product._id || product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

// Account Management Functions
function uploadAccounts() {
    const productId = document.getElementById('accountProductSelect').value;
    const accountList = document.getElementById('accountListInput').value.trim();
    
    if (!productId) {
        alert('Vui lòng chọn sản phẩm!');
        return;
    }
    
    if (!accountList) {
        alert('Vui lòng nhập danh sách tài khoản!');
        return;
    }
    
    // Parse accounts
    const lines = accountList.split('\n').filter(line => line.trim());
    const accounts = [];
    
    for (const line of lines) {
        const parts = line.trim().split(':');
        if (parts.length >= 2) {
            accounts.push({
                account: parts[0].trim(),
                password: parts.slice(1).join(':').trim()
            });
        }
    }
    
    if (accounts.length === 0) {
        alert('Không tìm thấy tài khoản hợp lệ! Định dạng: email:password');
        return;
    }
    
    // Save to localStorage (simulating API call)
    let productAccounts = JSON.parse(localStorage.getItem('productAccounts')) || {};
    
    if (!productAccounts[productId]) {
        productAccounts[productId] = [];
    }
    
    // Add accounts with status
    accounts.forEach(acc => {
        productAccounts[productId].push({
            id: Date.now() + Math.random(),
            account: acc.account,
            password: acc.password,
            status: 'available',
            uploadedAt: new Date().toISOString()
        });
    });
    
    localStorage.setItem('productAccounts', JSON.stringify(productAccounts));
    
    alert(`Đã upload ${accounts.length} tài khoản thành công!`);
    
    // Clear input
    document.getElementById('accountListInput').value = '';
    
    // Update stats
    checkAccountStock();
}

function checkAccountStock() {
    const productId = document.getElementById('accountProductSelect').value;
    
    if (!productId) {
        alert('Vui lòng chọn sản phẩm!');
        return;
    }
    
    const productAccounts = JSON.parse(localStorage.getItem('productAccounts')) || {};
    const accounts = productAccounts[productId] || [];
    
    const available = accounts.filter(acc => acc.status === 'available').length;
    const sold = accounts.filter(acc => acc.status === 'sold').length;
    
    document.getElementById('availableCount').textContent = available;
    document.getElementById('soldCount').textContent = sold;
    document.getElementById('accountStats').style.display = 'flex';
    
    if (available === 0) {
        alert('⚠️ Cảnh báo: Sản phẩm này đã hết tài khoản!');
    }
}

async function toggleMaintenance() {
    const isEnabled = document.getElementById('maintenanceMode').checked;
    
    try {
        // Gọi API để cập nhật trạng thái
        const response = await fetch('/api/maintenance/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                enabled: isEnabled,
                message: localStorage.getItem('maintenanceMessage') || 'Website đang bảo trì',
                eta: localStorage.getItem('maintenanceETA') || '30 phút',
                telegram: localStorage.getItem('shopTelegram') || 'https://t.me/hanghoammo'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Backup to localStorage for fallback
            localStorage.setItem('maintenanceMode', isEnabled);
            sessionStorage.removeItem('maintenanceBannerClosed');
            
            if (isEnabled) {
                alert('✅ Đã bật chế độ bảo trì. Tất cả khách hàng sẽ thấy banner ngay lập tức!');
            } else {
                alert('✅ Đã tắt chế độ bảo trì. Banner sẽ bị ẩn cho tất cả khách hàng!');
            }
        } else {
            alert('❌ Lỗi: Không thể cập nhật trạng thái bảo trì!');
        }
    } catch (error) {
        console.error('Error toggling maintenance:', error);
        alert('❌ Lỗi kết nối server! Vui lòng thử lại.');
    }
}

async function saveMaintenanceSettings() {
    const message = document.getElementById('maintenanceMessage').value;
    const eta = document.getElementById('maintenanceETA').value;
    
    if (!message.trim()) {
        alert('Vui lòng nhập nội dung thông báo!');
        return;
    }
    
    try {
        const isEnabled = document.getElementById('maintenanceMode').checked;
        
        // Gọi API để cập nhật
        const response = await fetch('/api/maintenance/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                enabled: isEnabled,
                message: message,
                eta: eta || '30 phút',
                telegram: localStorage.getItem('shopTelegram') || 'https://t.me/hanghoammo'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Backup to localStorage
            localStorage.setItem('maintenanceMessage', message);
            localStorage.setItem('maintenanceETA', eta || '30 phút');
            sessionStorage.removeItem('maintenanceBannerClosed');
            
            alert('✅ Lưu cài đặt bảo trì thành công! Tất cả khách hàng sẽ thấy thông báo mới ngay lập tức!');
        } else {
            alert('❌ Lỗi: Không thể lưu cài đặt!');
        }
    } catch (error) {
        console.error('Error saving maintenance settings:', error);
        alert('❌ Lỗi kết nối server! Vui lòng thử lại.');
    }
}

// Keep old function for backward compatibility
function saveMaintenanceMessage() {
    saveMaintenanceSettings();
}

function saveShopInfo() {
    const shopName = document.getElementById('shopName').value;
    const shopPhone = document.getElementById('shopPhone').value;
    const shopEmail = document.getElementById('shopEmail').value;
    const shopTelegram = document.getElementById('shopTelegram').value;
    
    localStorage.setItem('shopName', shopName);
    localStorage.setItem('shopPhone', shopPhone);
    localStorage.setItem('shopEmail', shopEmail);
    localStorage.setItem('shopTelegram', shopTelegram);
    
    alert('Lưu thông tin shop thành công!');
}

// Utilities
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN');
}

function getCategoryName(category) {
    const categories = {
        'ai': 'AI',
        'design': 'Design',
        'entertainment': 'Entertainment',
        'software': 'Software',
        'vpn': 'VPN',
        'service': 'Service'
    };
    return categories[category] || category;
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Chờ xử lý',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statuses[status] || status;
}

function getNotificationTypeText(type) {
    const types = {
        'info': 'Thông tin',
        'warning': 'Cảnh báo',
        'success': 'Thành công',
        'error': 'Lỗi'
    };
    return types[type] || type;
}

function toggleSidebar() {
    document.querySelector('.admin-sidebar').classList.toggle('active');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('adminDarkMode', isDark);
    
    const icon = event.target.closest('button').querySelector('i');
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        window.location.href = 'index.html';
    }
}

// Load dark mode preference
if (localStorage.getItem('adminDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const darkModeBtn = document.querySelector('.btn-icon i.fa-moon');
    if (darkModeBtn) {
        darkModeBtn.classList.remove('fa-moon');
        darkModeBtn.classList.add('fa-sun');
    }
}
