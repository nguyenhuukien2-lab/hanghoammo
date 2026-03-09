// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return; // Stop if not admin
    
    await loadDashboard();
    loadNotifications();
    loadSettings();
});

// Check admin authentication
async function checkAdminAuth() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert('Vui lòng đăng nhập!');
        window.location.href = 'index.html';
        return false;
    }
    
    // MUST verify token with server
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Token không hợp lệ');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        // Check if user is admin
        if (result.data.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = 'index.html';
            return false;
        }
        
        // Update localStorage with verified user info
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        return true;
        
    } catch (error) {
        console.error('Auth check error:', error);
        alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return false;
    }
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    const response = await fetch(`/api${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message || 'Request failed');
    }
    
    return result;
}

// Show notification
function showNotification(message, type = 'success') {
    // Simple alert for now
    alert(message);
}

// Load all data from API
let products = [];
let orders = [];
let customers = [];
let notifications = [];

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
        'deposits': 'Quản lý nạp tiền',
        'notifications': 'Quản lý thông báo',
        'settings': 'Cài đặt hệ thống'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
    
    // Load data for specific sections
    if (sectionId === 'deposits') {
        loadDepositRequests();
    }
}

// Dashboard
async function loadDashboard() {
    try {
        // Load products from API
        const productsData = await apiRequest('/products');
        products = productsData.data || [];
        
        // Load orders from API
        const ordersData = await apiRequest('/admin/orders');
        orders = ordersData.data || [];
        
        // Load users from API
        const usersData = await apiRequest('/admin/users');
        customers = usersData.data || [];
        
        // Update stats
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalCustomers').textContent = customers.length;
        
        const totalRevenue = orders
            .filter(o => o.status === 'completed')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
        
        // Load recent orders
        loadRecentOrders();
        
        // Load top products
        loadTopProducts();
        
        // Load initial data for other sections
        loadProducts();
        loadOrders();
        loadCustomers();
    } catch (error) {
        console.error('Load dashboard error:', error);
        showNotification('Không thể tải dữ liệu dashboard: ' + error.message, 'error');
    }
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
            <td><strong>#${order.id}</strong></td>
            <td>${order.user_email || 'Khách hàng'}</td>
            <td><strong>${formatPrice(order.total_amount)}</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${formatDate(order.created_at)}</td>
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
async function loadProducts() {
    try {
        // If products already loaded from dashboard, just render
        if (products.length === 0) {
            const data = await apiRequest('/products');
            products = data.data || [];
        }
        
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
                    <button class="btn-primary btn-sm" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load products error:', error);
        showNotification('Không thể tải danh sách sản phẩm: ' + error.message, 'error');
    }
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
async function loadOrders() {
    try {
        // If orders already loaded from dashboard, just render
        if (orders.length === 0) {
            const data = await apiRequest('/admin/orders');
            orders = data.data || [];
        }
        
        const tbody = document.getElementById('ordersTable');
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có đơn hàng</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>${order.user_email || 'Khách hàng'}</td>
                <td>${order.items_count || 0} sản phẩm</td>
                <td><strong>${formatPrice(order.total_amount)}</strong></td>
                <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                <td>${formatDate(order.created_at)}</td>
                <td>
                    <button class="btn-success btn-sm" onclick="updateOrderStatus(${order.id}, 'completed')" title="Hoàn thành">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-danger btn-sm" onclick="updateOrderStatus(${order.id}, 'cancelled')" title="Hủy">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load orders error:', error);
        showNotification('Không thể tải danh sách đơn hàng: ' + error.message, 'error');
    }
}

function filterOrders() {
    const search = document.getElementById('searchOrder').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders')) || [];
    let filtered = adminOrders;
    
    if (search) {
        filtered = filtered.filter(o => 
            o.id.toLowerCase().includes(search) ||
            (o.customerName && o.customerName.toLowerCase().includes(search)) ||
            (o.customerEmail && o.customerEmail.toLowerCase().includes(search))
        );
    }
    
    if (status) {
        filtered = filtered.filter(o => o.status === status);
    }
    
    const tbody = document.getElementById('ordersTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không tìm thấy đơn hàng</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName || order.customerEmail || 'Khách hàng'}</td>
            <td>${order.products ? order.products.length : (order.items ? order.items.length : 0)} sản phẩm</td>
            <td><strong>${formatPrice(order.total)}</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${formatDate(order.createdAt || order.date)}</td>
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
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders')) || [];
    const order = adminOrders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('adminOrders', JSON.stringify(adminOrders));
        loadOrders();
        loadDashboard();
        alert('Cập nhật trạng thái thành công!');
    }
}

// Customers Management
async function loadCustomers() {
    try {
        // If customers already loaded from dashboard, just render
        if (customers.length === 0) {
            const data = await apiRequest('/admin/users');
            customers = data.data || [];
        }
        
        const tbody = document.getElementById('customersTable');
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có khách hàng</td></tr>';
            if (document.getElementById('totalCustomers')) {
                document.getElementById('totalCustomers').textContent = '0';
            }
            return;
        }
        
        // Calculate stats for each customer
        const customersWithStats = customers.map(user => {
            const customerOrders = orders.filter(o => o.user_id === user.id);
            const totalSpent = customerOrders
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + (o.total_amount || 0), 0);
            
            return {
                ...user,
                orderCount: customerOrders.length,
                totalSpent: totalSpent
            };
        });
        
        // Sort by total spent (descending)
        customersWithStats.sort((a, b) => b.totalSpent - a.totalSpent);
        
        tbody.innerHTML = customersWithStats.map(customer => `
            <tr>
                <td><strong>${customer.email}</strong></td>
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.orderCount}</td>
                <td><strong>${formatPrice(customer.totalSpent)}</strong></td>
                <td>${formatDate(customer.created_at)}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="viewCustomerDetails(${customer.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        if (document.getElementById('totalCustomers')) {
            document.getElementById('totalCustomers').textContent = customers.length;
        }
    } catch (error) {
        console.error('Load customers error:', error);
        showNotification('Không thể tải danh sách khách hàng: ' + error.message, 'error');
    }
}

function filterCustomers() {
    const search = document.getElementById('searchCustomer').value.toLowerCase();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const orders = JSON.parse(localStorage.getItem('adminOrders')) || [];
    
    let filtered = users;
    
    if (search) {
        filtered = filtered.filter(c => 
            c.email.toLowerCase().includes(search) || 
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.phone && c.phone.includes(search))
        );
    }
    
    // Calculate stats for filtered customers
    const customersWithStats = filtered.map(user => {
        const customerOrders = orders.filter(o => o.customerEmail === user.email);
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        return {
            ...user,
            orderCount: customerOrders.length,
            totalSpent: totalSpent,
            createdAt: user.createdAt || new Date().toISOString()
        };
    });
    
    const tbody = document.getElementById('customersTable');
    if (customersWithStats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy khách hàng</td></tr>';
        return;
    }
    
    tbody.innerHTML = customersWithStats.map(customer => `
        <tr>
            <td><strong>${customer.email}</strong></td>
            <td>${customer.name || 'N/A'}</td>
            <td>${customer.orderCount}</td>
            <td><strong>${formatPrice(customer.totalSpent)}</strong></td>
            <td>${formatDate(customer.createdAt)}</td>
            <td>
                <button class="btn-primary btn-sm" onclick="viewCustomerDetails('${customer.email}')" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewCustomerDetails(userId) {
    const customer = customers.find(u => u.id === userId);
    if (!customer) {
        alert('Không tìm thấy khách hàng!');
        return;
    }
    
    const customerOrders = orders.filter(o => o.user_id === userId);
    const totalSpent = customerOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    let ordersList = '';
    if (customerOrders.length > 0) {
        ordersList = customerOrders.map(order => `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>Mã đơn:</strong> #${order.id}<br>
                <strong>Tổng tiền:</strong> ${formatPrice(order.total_amount)}<br>
                <strong>Ngày:</strong> ${formatDate(order.created_at)}<br>
                <strong>Trạng thái:</strong> ${getStatusText(order.status)}
            </div>
        `).join('');
    } else {
        ordersList = '<p style="text-align: center; color: #999;">Chưa có đơn hàng</p>';
    }
    
    const modalContent = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 20px;">Chi tiết khách hàng</h3>
            <div style="margin-bottom: 15px;">
                <strong>Tên:</strong> ${customer.name || 'N/A'}<br>
                <strong>Email:</strong> ${customer.email}<br>
                <strong>Số điện thoại:</strong> ${customer.phone || 'N/A'}<br>
                <strong>Ngày đăng ký:</strong> ${formatDate(customer.created_at)}<br>
                <strong>Tổng đơn hàng:</strong> ${customerOrders.length}<br>
                <strong>Tổng chi tiêu:</strong> ${formatPrice(totalSpent)}
            </div>
            <h4 style="margin: 20px 0 10px 0;">Lịch sử đơn hàng:</h4>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px;">
                ${ordersList}
            </div>
        </div>
    `;
    
    // Create a simple modal
    const existingModal = document.getElementById('customerDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'customerDetailModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
            <button onclick="document.getElementById('customerDetailModal').remove()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            ${modalContent}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
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


// ==================== DEPOSIT MANAGEMENT ====================

// Load deposit requests
async function loadDepositRequests() {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showNotification('Vui lòng đăng nhập!', 'error');
            return;
        }
        
        const response = await fetch('/api/admin/deposits', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        const deposits = result.data || [];
        const container = document.getElementById('depositsList');
        
        if (!container) return;
        
        if (deposits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Không có yêu cầu nạp tiền nào</p>
                </div>
            `;
            return;
        }
        
        // Group by status
        const pending = deposits.filter(d => d.status === 'pending');
        const approved = deposits.filter(d => d.status === 'approved');
        const rejected = deposits.filter(d => d.status === 'rejected');
        
        let html = '';
        
        // Pending deposits
        if (pending.length > 0) {
            html += '<h4 style="margin: 20px 0; color: #ffa502;">⏳ Chờ duyệt (' + pending.length + ')</h4>';
            html += pending.map(dep => renderDepositCard(dep)).join('');
        }
        
        // Approved deposits
        if (approved.length > 0) {
            html += '<h4 style="margin: 20px 0; color: #26de81;">✅ Đã duyệt (' + approved.length + ')</h4>';
            html += approved.map(dep => renderDepositCard(dep)).join('');
        }
        
        // Rejected deposits
        if (rejected.length > 0) {
            html += '<h4 style="margin: 20px 0; color: #ff4757;">❌ Đã từ chối (' + rejected.length + ')</h4>';
            html += rejected.map(dep => renderDepositCard(dep)).join('');
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Failed to load deposit requests:', error);
        showNotification('Không thể tải danh sách nạp tiền: ' + error.message, 'error');
    }
}

// Render deposit card
function renderDepositCard(dep) {
    const statusText = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    };
    
    const statusColors = {
        'pending': '#ffa502',
        'approved': '#26de81',
        'rejected': '#ff4757'
    };
    
    return `
        <div class="deposit-card" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">
                            ${dep.user_name ? dep.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 16px; color: #333;">${dep.user_name || 'User'}</div>
                            <div style="color: #666; font-size: 14px;">${dep.user_email}</div>
                            ${dep.user_phone ? `<div style="color: #999; font-size: 13px;">${dep.user_phone}</div>` : ''}
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
                        <div>
                            <div style="color: #999; font-size: 13px; margin-bottom: 5px;">Số tiền</div>
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">
                                ${dep.amount.toLocaleString('vi-VN')}đ
                            </div>
                        </div>
                        <div>
                            <div style="color: #999; font-size: 13px; margin-bottom: 5px;">Phương thức</div>
                            <div style="font-weight: 600; color: #333;">
                                ${dep.payment_method === 'momo' ? '📱 MoMo' : '🏦 Ngân hàng'}
                            </div>
                        </div>
                        <div>
                            <div style="color: #999; font-size: 13px; margin-bottom: 5px;">Mã giao dịch</div>
                            <div style="font-weight: 600; color: #333; font-family: monospace;">
                                ${dep.transaction_code}
                            </div>
                        </div>
                        <div>
                            <div style="color: #999; font-size: 13px; margin-bottom: 5px;">Thời gian</div>
                            <div style="color: #666; font-size: 14px;">
                                ${new Date(dep.created_at).toLocaleString('vi-VN')}
                            </div>
                        </div>
                    </div>
                    
                    ${dep.note ? `
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <div style="color: #999; font-size: 13px; margin-bottom: 3px;">Ghi chú:</div>
                            <div style="color: #555; font-size: 14px;">${dep.note}</div>
                        </div>
                    ` : ''}
                    
                    ${dep.status === 'rejected' && dep.reject_reason ? `
                        <div style="background: #fff5f5; border-left: 3px solid #ff4757; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <div style="color: #ff4757; font-size: 13px; margin-bottom: 3px; font-weight: 600;">Lý do từ chối:</div>
                            <div style="color: #666; font-size: 14px;">${dep.reject_reason}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="text-align: right;">
                    <div style="background: ${statusColors[dep.status]}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 15px;">
                        ${statusText[dep.status]}
                    </div>
                    
                    ${dep.status === 'pending' ? `
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn-approve-deposit" data-id="${dep.id}" data-user="${dep.user_id}" data-amount="${dep.amount}" style="background: #26de81; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                                <i class="fas fa-check"></i> Duyệt
                            </button>
                            <button class="btn-reject-deposit" data-id="${dep.id}" style="background: #ff4757; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                                <i class="fas fa-times"></i> Từ chối
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Approve deposit
async function approveDeposit(depositId, userId, amount) {
    if (!confirm(`Xác nhận duyệt nạp ${amount.toLocaleString('vi-VN')}đ?`)) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showNotification('Vui lòng đăng nhập!', 'error');
            return;
        }
        
        const response = await fetch('/api/admin/approve-deposit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deposit_id: depositId,
                user_id: userId,
                amount: amount
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        showNotification('Đã duyệt nạp tiền thành công!');
        loadDepositRequests();
        
    } catch (error) {
        console.error('Approve deposit error:', error);
        showNotification('Duyệt nạp tiền thất bại: ' + error.message, 'error');
    }
}

// Reject deposit
async function rejectDeposit(depositId) {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason || reason.trim() === '') {
        showNotification('Vui lòng nhập lý do từ chối', 'error');
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showNotification('Vui lòng đăng nhập!', 'error');
            return;
        }
        
        const response = await fetch('/api/admin/reject-deposit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deposit_id: depositId,
                reason: reason.trim()
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        showNotification('Đã từ chối yêu cầu nạp tiền');
        loadDepositRequests();
        
    } catch (error) {
        console.error('Reject deposit error:', error);
        showNotification('Từ chối thất bại: ' + error.message, 'error');
    }
}

// Event delegation for deposit buttons
document.addEventListener('click', function(e) {
    // Approve button
    if (e.target.closest('.btn-approve-deposit')) {
        const btn = e.target.closest('.btn-approve-deposit');
        const depositId = btn.dataset.id; // Keep as string (UUID)
        const userId = btn.dataset.user; // Keep as string (UUID)
        const amount = parseInt(btn.dataset.amount);
        approveDeposit(depositId, userId, amount);
    }
    
    // Reject button
    if (e.target.closest('.btn-reject-deposit')) {
        const btn = e.target.closest('.btn-reject-deposit');
        const depositId = btn.dataset.id; // Keep as string (UUID)
        rejectDeposit(depositId);
    }
});

// Add to initialization
document.addEventListener('DOMContentLoaded', function() {
    // Check if on deposits tab
    const depositsSection = document.getElementById('deposits');
    if (depositsSection) {
        loadDepositRequests();
    }
});
