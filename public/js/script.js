// API Configuration
const API_URL = '/api';
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// CSRF Helper
function getCsrfToken() {
    const name = 'csrfToken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

// Products Data
let products = [];

// Sample Products for fallback
function getSampleProducts() {
    return [
        {
            id: 'sample-1',
            name: 'ChatGPT Pro giá rẻ hơn gốc',
            category: 'ai',
            price: 40000,
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
            description: 'Tài khoản ChatGPT Pro chất lượng cao, giá rẻ hơn gốc 50%',
            sold: 150,
            rating: 4.8,
            stock: 25,
            stock_status: 'in-stock',
            stock_class: 'in-stock',
            stock_display: '25 có sẵn',
            badge: 'HOT'
        },
        {
            id: 'sample-2',
            name: 'Netflix Premium 1 tháng',
            category: 'entertainment',
            price: 35000,
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1024px-Netflix_2015_logo.svg.png',
            description: 'Tài khoản Netflix Premium chất lượng cao, xem 4K',
            sold: 89,
            rating: 4.9,
            stock: 8,
            stock_status: 'low-stock',
            stock_class: 'low-stock',
            stock_display: 'Chỉ còn 8',
            badge: 'SALE'
        },
        {
            id: 'sample-3',
            name: 'Canva Pro 1 năm',
            category: 'design',
            price: 120000,
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Canva_icon_2021.svg/1024px-Canva_icon_2021.svg.png',
            description: 'Tài khoản Canva Pro full tính năng, thiết kế chuyên nghiệp',
            sold: 67,
            rating: 4.7,
            stock: 45,
            stock_status: 'in-stock',
            stock_class: 'in-stock',
            stock_display: '45 có sẵn'
        },
        {
            id: 'sample-4',
            name: 'Spotify Premium 3 tháng',
            category: 'entertainment',
            price: 55000,
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png',
            description: 'Tài khoản Spotify Premium, nghe nhạc không quảng cáo',
            sold: 123,
            rating: 4.6,
            stock: 0,
            stock_status: 'out-of-stock',
            stock_class: 'out-of-stock',
            stock_display: 'Hết hàng',
            badge: 'NEW'
        },
        {
            id: 'sample-5',
            name: 'Adobe Creative Cloud',
            category: 'design',
            price: 180000,
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Adobe_Creative_Cloud_rainbow_icon.svg/1024px-Adobe_Creative_Cloud_rainbow_icon.svg.png',
            description: 'Bộ phần mềm Adobe Creative Cloud đầy đủ',
            sold: 34,
            rating: 4.9,
            stock: 12,
            stock_status: 'in-stock',
            stock_class: 'in-stock',
            stock_display: '12 có sẵn'
        },
        {
            id: 'sample-6',
            name: 'Gmail Business 1 năm',
            category: 'email',
            price: 95000,
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1024px-Gmail_icon_%282020%29.svg.png',
            description: 'Tài khoản Gmail Business với tên miền riêng',
            sold: 78,
            rating: 4.5,
            stock: 30,
            stock_status: 'in-stock',
            stock_class: 'in-stock',
            stock_display: '30 có sẵn'
        }
    ];
}

// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(!['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET') ? { 'X-CSRF-Token': getCsrfToken() } : {}),
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        // Nếu token không hợp lệ hoặc user không tồn tại → tự động logout
        if (response.status === 401 || response.status === 403) {
            logout();
            return data;
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Clear products cache (for debugging)
function clearProductsCache() {
    localStorage.removeItem('adminProducts');
    console.log('✅ Products cache cleared');
    showNotification('Đã xóa cache sản phẩm. Trang sẽ tải lại.', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Load products from API only (no fallback)
async function loadProducts() {
    try {
        // Try to load from API first
        const response = await fetch(`${API_URL}/products`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            products = result.data;
            // Cache with timestamp
            const cacheData = {
                products: products,
                timestamp: Date.now()
            };
            localStorage.setItem('adminProducts', JSON.stringify(cacheData));
            console.log('✅ Loaded ' + products.length + ' products from API');
            
            // Clear cart if it contains old numeric IDs
            const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
            if (currentCart.length > 0 && currentCart[0].id && typeof currentCart[0].id === 'number') {
                console.log('⚠️ Clearing cart with old numeric IDs');
                localStorage.removeItem('cart');
                cart = [];
                updateCartCount();
            }
            
            return products;
        } else {
            console.warn('⚠️ API returned empty data');
        }
    } catch (error) {
        console.error('❌ Failed to load products from API:', error);
    }
    
    // Fallback to localStorage cache only (no sample products)
    const cached = localStorage.getItem('adminProducts');
    if (cached) {
        try {
            const cacheData = JSON.parse(cached);
            // Check if cache is an object with timestamp (new format)
            if (cacheData && cacheData.products && Array.isArray(cacheData.products)) {
                products = cacheData.products;
                const cacheAge = Date.now() - (cacheData.timestamp || 0);
                console.log('✅ Loaded ' + products.length + ' products from cache (age: ' + Math.round(cacheAge/1000) + 's)');
                return products;
            } else if (Array.isArray(cacheData)) {
                // Old format (array directly)
                products = cacheData;
                console.log('✅ Loaded ' + products.length + ' products from old cache format');
                return products;
            }
        } catch (e) {
            console.error('Failed to parse cache:', e);
        }
    }
    
    // No fallback - return empty array
    products = [];
    console.error('❌ No products available. Please check API connection or add products in admin panel.');
    
    return products;
}

// Sample products removed - only use API/Database
// If you need sample products, add them via admin panel or database

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function addToCart(productId) {
    // Kiểm tra đăng nhập
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        showNotification('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
        setTimeout(() => {
            openAuthModal('login');
        }, 500);
        return;
    }
    
    const product = products.find(p => (p._id || p.id) == productId);
    if (!product) return;

    const existingItem = cart.find(item => (item._id || item.id) == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: product._id || product.id,
            id: product._id || product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartUI();
    showNotification(`Đã thêm "${product.name}" vào giỏ hàng!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => (item._id || item.id) != productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => (item._id || item.id) == productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartBody = document.getElementById('cartBody');
    const totalAmount = document.getElementById('totalAmount');
    const subtotal = document.getElementById('subtotal');
    const cartItemCount = document.getElementById('cartItemCount');
    const summaryItemCount = document.getElementById('summaryItemCount');
    
    if (!cartBody) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartItemCount) cartItemCount.textContent = totalItems;
    if (summaryItemCount) summaryItemCount.textContent = totalItems;

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Giỏ hàng của bạn đang trống</p>
            </div>
        `;
        if (totalAmount) totalAmount.textContent = '0đ';
        if (subtotal) subtotal.textContent = '0đ';
        return;
    }

    let total = 0;
    let cartHTML = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const itemId = item._id || item.id;
        
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toLocaleString('vi-VN')}đ</div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQuantity('${itemId}', -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${itemId}', 1)">+</button>
                        <button class="btn-remove" onclick="removeFromCart('${itemId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    cartBody.innerHTML = cartHTML;
    if (totalAmount) totalAmount.textContent = total.toLocaleString('vi-VN') + 'đ';
    if (subtotal) subtotal.textContent = total.toLocaleString('vi-VN') + 'đ';
}

function toggleCart() {
    // Kiểm tra đăng nhập
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        showNotification('Vui lòng đăng nhập để xem giỏ hàng!', 'error');
        setTimeout(() => {
            openAuthModal('login');
        }, 500);
        return;
    }
    
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.toggle('active');
        updateCartUI();
    }
}

// Products Rendering
function renderProducts(productsToRender, containerId = 'hotProducts') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    const isNewDesign = container.classList.contains('products-grid-new');

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = isNewDesign ? 'product-card-new' : 'product-card';
        const productId = product._id || product.id;
        
        if (isNewDesign) {
            productCard.innerHTML = `
                <div class="product-image-new">
                    <img src="${product.image}" alt="${product.name}">
                    ${product.badge ? `<span class="product-badge-new">${product.badge}</span>` : ''}
                </div>
                <div class="product-info-new">
                    <h3 class="product-name-new">${product.name}</h3>
                    <div class="product-meta-new">
                        <div class="product-rating-new">
                            <i class="fas fa-star"></i>
                            <span>5.0</span>
                        </div>
                        <span class="product-sold-new">Đã bán ${product.sold || 0}</span>
                    </div>
                    <div class="product-price-new">${product.price.toLocaleString('vi-VN')}đ</div>
                    <button class="btn-add-cart-new" onclick="addToCart('${productId}')">
                        <i class="fas fa-cart-plus"></i>
                        <span>Cài đặt</span>
                    </button>
                    <div class="product-vendor-new">
                        <div class="vendor-logo-new">
                            <i class="fas fa-store"></i>
                        </div>
                        <span class="vendor-name-new">Mạnh98</span>
                    </div>
                </div>
            `;
        } else {
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price.toLocaleString('vi-VN')}đ</div>
                    <button class="btn-add-cart" onclick="addToCart('${productId}')">
                        <i class="fas fa-cart-plus"></i>
                        <span>Thêm vào giỏ</span>
                    </button>
                </div>
            `;
        }
        
        container.appendChild(productCard);
    });
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Auth Modal Functions
// Auth Modal Functions - Redirect to new pages
function openAuthModal(tab = 'login') {
    if (tab === 'login') {
        window.location.href = 'login.html';
    } else if (tab === 'register') {
        window.location.href = 'register.html';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function switchAuthTab(tab) {
    const loginTab = document.querySelector('[data-tab="login"]');
    const registerTab = document.querySelector('[data-tab="register"]');
    const forgotTab = document.querySelector('[data-tab="forgot"]');
    const loginForm = document.getElementById('modalLoginForm');
    const registerForm = document.getElementById('modalRegisterForm');
    const forgotForm = document.getElementById('modalForgotForm');
    const title = document.getElementById('authModalTitle');
    const subtitle = document.getElementById('authModalSubtitle');
    
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    if (forgotForm) forgotForm.classList.remove('active');
    
    loginTab.classList.remove('active');
    registerTab.classList.remove('active');
    if (forgotTab) forgotTab.classList.remove('active');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        loginForm.classList.add('active');
        title.textContent = 'Chào mừng trở lại!';
        subtitle.textContent = 'Đăng nhập để tiếp tục mua sắm';
    } else if (tab === 'register') {
        registerTab.classList.add('active');
        registerForm.classList.add('active');
        title.textContent = 'Tạo tài khoản mới';
        subtitle.textContent = 'Bắt đầu mua sắm';
    } else if (tab === 'forgot') {
        if (forgotTab) forgotTab.classList.add('active');
        if (forgotForm) {
            forgotForm.classList.add('active');
            // Reset form
            forgotForm.reset();
            document.getElementById('phoneVerifyGroup').style.display = 'none';
            document.getElementById('newPasswordGroup').style.display = 'none';
            document.getElementById('confirmNewPasswordGroup').style.display = 'none';
            document.getElementById('forgotSubmitBtn').querySelector('span').textContent = 'Tiếp tục';
            forgotForm.dataset.step = '1';
        }
        title.textContent = 'Quên mật khẩu?';
        subtitle.textContent = 'Nhập email để lấy lại mật khẩu';
    }
}

function toggleModalPassword(inputId, event) {
    const input = document.getElementById(inputId);
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Modal Login Form Handler
const modalLoginForm = document.getElementById('modalLoginForm');
if (modalLoginForm) {
    modalLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value.trim();
        const password = this.querySelector('input[type="password"]').value;
        
        const btnSubmit = this.querySelector('.btn-submit');
        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
        btnSubmit.disabled = true;
        
        try {
            // Gọi API đăng nhập
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            // Lưu token và user info từ API
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Đăng nhập thành công!');
            closeAuthModal();
            updateUserUI();
            checkLoginStatus();
        } catch (error) {
            let errorMessage = error.message || 'Đăng nhập thất bại!';
            
            // Special handling for rate limit errors
            if (errorMessage.includes('Quá nhiều') || errorMessage.includes('rate limit')) {
                errorMessage += ' 💡 Tip: Bạn có thể click nút "Reset Rate Limit" bên dưới nếu đang test.';
                
                // Show reset button if in development
                const resetButton = this.querySelector('.btn-reset-rate-limit');
                if (resetButton && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                    resetButton.style.display = 'block';
                }
            }
            
            showNotification(errorMessage, 'error');
        } finally {
            btnSubmit.innerHTML = originalHTML;
            btnSubmit.disabled = false;
        }
    });
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Count met requirements
    Object.values(requirements).forEach(met => {
        if (met) strength++;
    });
    
    return { strength, requirements };
}

function updatePasswordStrength(inputId, barId, textId) {
    const input = document.getElementById(inputId);
    const bar = document.getElementById(barId);
    const text = document.getElementById(textId);
    
    if (!input || !bar || !text) return;
    
    const password = input.value;
    const { strength, requirements } = checkPasswordStrength(password);
    
    // Update bar
    bar.className = 'password-strength-bar';
    if (strength === 0) {
        bar.classList.add('strength-none');
        text.textContent = '';
    } else if (strength <= 2) {
        bar.classList.add('strength-weak');
        text.textContent = 'Yếu';
        text.style.color = '#ff4757';
    } else if (strength <= 3) {
        bar.classList.add('strength-medium');
        text.textContent = 'Trung bình';
        text.style.color = '#ffa502';
    } else {
        bar.classList.add('strength-strong');
        text.textContent = 'Mạnh';
        text.style.color = '#26de81';
    }
    
    // Update requirements display
    const reqList = document.getElementById('passwordRequirements');
    if (reqList && password.length > 0) {
        reqList.style.display = 'block';
        reqList.innerHTML = `
            <div class="req-item ${requirements.length ? 'met' : ''}">
                <i class="fas fa-${requirements.length ? 'check-circle' : 'circle'}"></i>
                <span>Ít nhất 8 ký tự</span>
            </div>
            <div class="req-item ${requirements.uppercase ? 'met' : ''}">
                <i class="fas fa-${requirements.uppercase ? 'check-circle' : 'circle'}"></i>
                <span>Chữ hoa (A-Z)</span>
            </div>
            <div class="req-item ${requirements.lowercase ? 'met' : ''}">
                <i class="fas fa-${requirements.lowercase ? 'check-circle' : 'circle'}"></i>
                <span>Chữ thường (a-z)</span>
            </div>
            <div class="req-item ${requirements.number ? 'met' : ''}">
                <i class="fas fa-${requirements.number ? 'check-circle' : 'circle'}"></i>
                <span>Số (0-9)</span>
            </div>
            <div class="req-item ${requirements.special ? 'met' : ''}">
                <i class="fas fa-${requirements.special ? 'check-circle' : 'circle'}"></i>
                <span>Ký tự đặc biệt (!@#$...)</span>
            </div>
        `;
    } else if (reqList) {
        reqList.style.display = 'none';
    }
}

// Forgot Password Modal Functions
function showForgotPasswordForm() {
    closeAuthModal();
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        // Reset form
        const form = document.getElementById('forgotPasswordForm');
        if (form) form.reset();
    }
}

// Forgot password OTP variables
let forgotOtpSent = false;
let forgotOtpTimer = null;

async function requestForgotPasswordOTP() {
    const email = document.getElementById('forgotEmail').value.trim();
    const phone = document.getElementById('forgotPhone').value.trim();
    
    if (!email || !phone) {
        showNotification('Vui lòng nhập email và số điện thoại!', 'error');
        return;
    }
    
    const btn = document.getElementById('requestForgotOtpBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    btn.disabled = true;
    
    try {
        const data = await apiRequest('/auth/request-forgot-password-otp', {
            method: 'POST',
            body: JSON.stringify({ email, phone })
        });
        
        showNotification(data.message || 'Mã OTP đã được gửi!', 'success');
        forgotOtpSent = true;
        
        // Show OTP input section
        document.getElementById('forgotOtpSection').style.display = 'block';
        document.getElementById('requestForgotOtpBtn').style.display = 'none';
        document.getElementById('forgotPasswordSubmitBtn').style.display = 'block';
        
        // Start countdown timer (5 minutes)
        let timeLeft = 300;
        const timerDisplay = document.getElementById('forgotOtpTimer');
        
        forgotOtpTimer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(forgotOtpTimer);
                timerDisplay.textContent = 'Hết hạn';
                showNotification('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.', 'error');
            }
        }, 1000);
        
    } catch (error) {
        showNotification(error.message || 'Có lỗi xảy ra khi gửi mã OTP!', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    if (!forgotOtpSent) {
        showNotification('Vui lòng yêu cầu mã OTP trước!', 'error');
        return;
    }
    
    const form = event.target;
    const email = document.getElementById('forgotEmail').value.trim();
    const phone = document.getElementById('forgotPhone').value.trim();
    const newPassword = document.getElementById('forgotNewPassword').value;
    const otp = document.getElementById('forgotOtpCode').value.trim();
    
    if (!otp || otp.length !== 6) {
        showNotification('Vui lòng nhập mã OTP 6 số!', 'error');
        return;
    }
    
    const btnSubmit = document.getElementById('forgotPasswordSubmitBtn');
    const originalHTML = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btnSubmit.disabled = true;
    
    try {
        const data = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ email, phone, newPassword, otp })
        });
        
        showNotification(data.message || 'Đổi mật khẩu thành công!', 'success');
        closeForgotPasswordModal();
        
        if (forgotOtpTimer) clearInterval(forgotOtpTimer);
        
        // Mở modal đăng nhập sau 1s
        setTimeout(() => {
            openAuthModal('login');
        }, 1000);
        
    } catch (error) {
        showNotification(error.message || 'Có lỗi xảy ra!', 'error');
    } finally {
        btnSubmit.innerHTML = originalHTML;
        btnSubmit.disabled = false;
    }
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('forgotPasswordForm').reset();
    forgotOtpSent = false;
    document.getElementById('forgotOtpSection').style.display = 'none';
    document.getElementById('requestForgotOtpBtn').style.display = 'block';
    document.getElementById('forgotPasswordSubmitBtn').style.display = 'none';
    if (forgotOtpTimer) clearInterval(forgotOtpTimer);
}

// Modal Register Form Handler
const modalRegisterForm = document.getElementById('modalRegisterForm');
if (modalRegisterForm) {
    // Add password strength checker
    const passwordInput = modalRegisterForm.querySelector('#modalRegisterPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength('modalRegisterPassword', 'passwordStrengthBar', 'passwordStrengthText');
        });
    }
    
    modalRegisterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const inputs = this.querySelectorAll('input');
        const name = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const phone = inputs[2].value.trim();
        const password = inputs[3].value;
        const confirmPassword = inputs[4].value;
        
        if (password !== confirmPassword) {
            showNotification('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        // Validate password strength
        if (password.length < 8) {
            showNotification('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
            return;
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            showNotification('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số!', 'error');
            return;
        }
        
        const btnSubmit = this.querySelector('.btn-submit');
        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';
        btnSubmit.disabled = true;
        
        try {
            // Gọi API đăng ký
            const data = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, phone, password })
            });
            
            // Lưu token và user info từ API
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Đăng ký thành công! Vui lòng kiểm tra email (cả thư mục Spam/Junk) để nhận thông tin.');
            closeAuthModal();
            updateUserUI();
            checkLoginStatus();
        } catch (error) {
            showNotification(error.message || 'Đăng ký thất bại!', 'error');
        } finally {
            btnSubmit.innerHTML = originalHTML;
            btnSubmit.disabled = false;
        }
    });
}

// Forgot Password Form Handler
const modalForgotForm = document.getElementById('modalForgotForm');
if (modalForgotForm) {
    let forgotCurrentUser = null;
    
    modalForgotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const step = this.dataset.step || '1';
        const btnSubmit = document.getElementById('forgotSubmitBtn');
        const originalHTML = btnSubmit.innerHTML;
        
        if (step === '1') {
            // Step 1: Verify email
            const email = document.getElementById('forgotEmail').value.trim();
            
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...';
            btnSubmit.disabled = true;
            
            try {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.email === email);
                
                if (!user) {
                    throw new Error('Email không tồn tại trong hệ thống!');
                }
                
                forgotCurrentUser = user;
                
                // Show phone verification
                document.getElementById('phoneVerifyGroup').style.display = 'block';
                document.getElementById('forgotEmail').disabled = true;
                btnSubmit.querySelector('span').textContent = 'Xác minh';
                this.dataset.step = '2';
                
                showNotification('Vui lòng nhập số điện thoại để xác minh!', 'info');
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                btnSubmit.innerHTML = originalHTML;
                btnSubmit.disabled = false;
            }
            
        } else if (step === '2') {
            // Step 2: Verify phone
            const phone = document.getElementById('verifyPhone').value.trim();
            
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác minh...';
            btnSubmit.disabled = true;
            
            try {
                if (!forgotCurrentUser) {
                    throw new Error('Phiên làm việc hết hạn. Vui lòng thử lại!');
                }
                
                if (forgotCurrentUser.phone !== phone) {
                    throw new Error('Số điện thoại không khớp với tài khoản!');
                }
                
                // Show new password fields
                document.getElementById('newPasswordGroup').style.display = 'block';
                document.getElementById('confirmNewPasswordGroup').style.display = 'block';
                document.getElementById('verifyPhone').disabled = true;
                btnSubmit.querySelector('span').textContent = 'Đặt lại mật khẩu';
                this.dataset.step = '3';
                
                showNotification('Xác minh thành công! Vui lòng nhập mật khẩu mới.', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                btnSubmit.innerHTML = originalHTML;
                btnSubmit.disabled = false;
            }
            
        } else if (step === '3') {
            // Step 3: Reset password
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmPassword) {
                showNotification('Mật khẩu xác nhận không khớp!', 'error');
                return;
            }
            
            // Check password strength
            const { strength } = checkPasswordStrength(newPassword);
            if (strength < 3) {
                showNotification('Mật khẩu quá yếu! Vui lòng đáp ứng ít nhất 3/5 yêu cầu.', 'error');
                return;
            }
            
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';
            btnSubmit.disabled = true;
            
            try {
                if (!forgotCurrentUser) {
                    throw new Error('Phiên làm việc hết hạn. Vui lòng thử lại!');
                }
                
                // Gọi API đổi mật khẩu
                await apiRequest('/auth/change-password', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: forgotCurrentUser.email,
                        phone: document.getElementById('verifyPhone').value.trim(),
                        newPassword: newPassword
                    })
                });
                
                showNotification('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.', 'success');
                
                // Reset form and switch to login
                this.reset();
                this.dataset.step = '1';
                forgotCurrentUser = null;
                
                setTimeout(() => {
                    switchAuthTab('login');
                }, 1500);
                
            } catch (error) {
                showNotification(error.message || 'Đổi mật khẩu thất bại!', 'error');
            } finally {
                btnSubmit.innerHTML = originalHTML;
                btnSubmit.disabled = false;
            }
        }
    });
}

// Update UI based on auth state
function updateUserUI() {
    const btnLogin = document.querySelector('.btn-auth.login');
    const btnRegister = document.querySelector('.btn-auth.register');
    
    if (currentUser && btnLogin && btnRegister) {
        btnLogin.innerHTML = `<i class="fas fa-user"></i><span>${currentUser.name}</span>`;
        btnLogin.onclick = null;
        btnRegister.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Đăng xuất</span>`;
        btnRegister.onclick = logout;
        
        // Load wallet balance
        loadWalletBalance();
    }
}

// Load wallet balance
async function loadWalletBalance() {
    if (!authToken) return;
    
    try {
        const data = await apiRequest('/wallet');
        const balance = data.data.balance || 0;
        
        // Update balance display if element exists
        const balanceEl = document.getElementById('userBalanceDisplay');
        if (balanceEl) {
            balanceEl.textContent = `💰 ${balance.toLocaleString('vi-VN')}đ`;
        }
        
        // Also update in user info if exists
        const userInfo = document.querySelector('.user-info');
        if (userInfo && !document.getElementById('userBalanceDisplay')) {
            const balanceSpan = document.createElement('span');
            balanceSpan.id = 'userBalanceDisplay';
            balanceSpan.className = 'user-balance';
            balanceSpan.textContent = `💰 ${balance.toLocaleString('vi-VN')}đ`;
            balanceSpan.style.fontSize = '12px';
            balanceSpan.style.color = '#26de81';
            balanceSpan.style.fontWeight = 'bold';
            userInfo.appendChild(balanceSpan);
        }
    } catch (error) {
        console.error('Failed to load wallet balance:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showNotification('Đã đăng xuất!');
    location.reload();
}

// Checkout Functions
function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Giỏ hàng trống! Vui lòng thêm sản phẩm', 'error');
        return;
    }

    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCheckoutItems();
        updateCheckoutTotal();
    }
}

function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderCheckoutItems() {
    const checkoutItems = document.getElementById('checkoutItems');
    if (!checkoutItems) return;

    let itemsHTML = '';
    cart.forEach(item => {
        itemsHTML += `
            <div class="checkout-item">
                <div class="checkout-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${item.name}</div>
                    <div class="checkout-item-details">
                        <span>Số lượng: ${item.quantity}</span>
                        <span class="checkout-item-price">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
            </div>
        `;
    });

    checkoutItems.innerHTML = itemsHTML;
}

function updateCheckoutTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const checkoutTotal = document.getElementById('checkoutTotal');
    if (checkoutTotal) {
        checkoutTotal.textContent = total.toLocaleString('vi-VN') + 'đ';
    }
}

async function confirmPayment() {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const inputs = form.querySelectorAll('input, textarea');
    const customerInfo = {
        name: inputs[0].value.trim(),
        phone: inputs[1].value.trim(),
        email: inputs[2].value.trim()
    };
    const note = inputs[3].value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    const orderData = {
        id: "ORD-" + Date.now(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        products: cart.map(item => ({
            product: item._id || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod,
        note,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const btnConfirm = document.querySelector('.btn-confirm-payment');
    const originalHTML = btnConfirm.innerHTML;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btnConfirm.disabled = true;

    try {
        if (authToken) {
            try {
                await apiRequest('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });
            } catch (apiError) {
                console.log('API not available, saving to localStorage');
            }
        }
        
        let adminOrders = JSON.parse(localStorage.getItem('adminOrders')) || [];
        adminOrders.unshift(orderData);
        localStorage.setItem('adminOrders', JSON.stringify(adminOrders));
        
        let adminCustomers = JSON.parse(localStorage.getItem('adminCustomers')) || [];
        let customer = adminCustomers.find(c => c.email === customerInfo.email);
        if (customer) {
            customer.orders += 1;
        } else {
            adminCustomers.push({
                id: adminCustomers.length + 1,
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
                orders: 1,
                createdAt: new Date().toISOString()
            });
        }
        localStorage.setItem('adminCustomers', JSON.stringify(adminCustomers));
        
        let adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
        cart.forEach(cartItem => {
            const product = adminProducts.find(p => (p.id || p._id) == (cartItem.id || cartItem._id));
            if (product) {
                product.sold = (product.sold || 0) + cartItem.quantity;
            }
        });
        localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
        
        showNotification('Đặt hàng thành công! Vui lòng kiểm tra email (cả thư mục Spam/Junk) để nhận tài khoản.');
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartUI();
        
        closeCheckoutModal();
        toggleCart();
        form.reset();
    } catch (error) {
        showNotification(error.message || 'Đặt hàng thất bại!', 'error');
    } finally {
        btnConfirm.innerHTML = originalHTML;
        btnConfirm.disabled = false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Validate and clean cart on page load
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (currentCart.length > 0) {
        const hasOldIds = currentCart.some(item => {
            const id = item.id || item._id;
            return typeof id === 'number' || (typeof id === 'string' && id.length < 10);
        });
        
        if (hasOldIds) {
            console.warn('⚠️ Clearing cart with old numeric IDs');
            localStorage.removeItem('cart');
            cart = [];
        }
    }
    
    updateCartCount();
    updateUserUI();
    
    await loadProducts();
    
    const hotProductsContainer = document.getElementById('hotProducts');
    if (hotProductsContainer) {
        const hotProducts = products.slice(0, 8);
        renderProducts(hotProducts, 'hotProducts');
    }
});


// Render products for explore/home page
function renderProductsExplore(productsToRender, container) {
    if (!container) return;
    container.innerHTML = '';

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card-explore';
        const productId = product._id || product.id;
        
        productCard.innerHTML = `
            <div class="product-image-explore">
                <img src="${product.image}" alt="${product.name}">
                ${product.badge ? `<span class="badge-explore ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
            </div>
            <div class="product-info-explore">
                <h3 class="product-name-explore">${product.name}</h3>
                <div class="product-price-explore">
                    <span class="price-current">${product.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <div class="product-meta-explore">
                    <div class="rating-explore">
                        <i class="fas fa-star"></i>
                        <span>5.0</span>
                    </div>
                    <span class="sold-explore">Đã bán ${product.sold || 0}</span>
                </div>
                <div class="product-vendor-explore">
                    <img src="https://ui-avatars.com/api/?name=Manh98&background=667eea&color=fff&size=32" alt="Vendor">
                    <span>Mạnh98</span>
                </div>
                <div class="product-actions-explore">
                    <button class="btn-view-detail" onclick="event.stopPropagation(); viewProductDetail('${productId}')">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    <button class="btn-add-cart-quick" onclick="event.stopPropagation(); addToCart('${productId}')">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        `;
        
        productCard.onclick = () => viewProductDetail(productId);
        container.appendChild(productCard);
    });
}


// Dark Mode Toggle
// Theme System (Light, Dark, System)
let currentTheme = localStorage.getItem('theme') || 'system';

function initTheme() {
    applyTheme(currentTheme);
    updateThemeIcon();
}

function applyTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-mode', prefersDark);
    } else if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function updateThemeIcon() {
    const icon = document.querySelector('.btn-theme-toggle i');
    if (icon) {
        if (currentTheme === 'dark') {
            icon.className = 'fas fa-moon';
        } else if (currentTheme === 'light') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-desktop';
        }
    }
}

function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    updateThemeIcon();
    
    // Update active state in menu
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');
    
    // Close menu
    document.getElementById('themeMenu')?.classList.remove('active');
}

// Close theme menu when clicking outside
document.addEventListener('click', function(e) {
    const themeBtn = document.querySelector('.btn-theme-toggle');
    const themeMenu = document.getElementById('themeMenu');
    if (themeMenu && !themeBtn?.contains(e.target) && !themeMenu.contains(e.target)) {
        themeMenu.classList.remove('active');
    }
});

// Listen to system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (currentTheme === 'system') {
        applyTheme('system');
    }
});

// Load theme preference on page load
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
});


// Search Dropdown Functions
let searchTimeout;

function showSearchResults(query) {
    clearTimeout(searchTimeout);
    
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;
    
    if (!query || query.trim().length < 1) {
        dropdown.classList.remove('show');
        return;
    }
    
    searchTimeout = setTimeout(() => {
        const results = products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6);
        
        if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-no-results">Không tìm thấy sản phẩm nào</div>';
            dropdown.classList.add('show');
            return;
        }
        
        let html = '';
        results.forEach(product => {
            html += `
                <div class="search-result-item" onmousedown="goToProduct('${product._id || product.id}')">
                    <img src="${product.image}" alt="${product.name}" class="search-result-img">
                    <div class="search-result-info">
                        <div class="search-result-name">${product.name}</div>
                        <div class="search-result-price">${formatPrice(product.price)}</div>
                        <div class="search-result-meta">
                            <span><i class="fas fa-star"></i> 5.0</span>
                            <span>Đã bán ${product.sold || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (results.length >= 6) {
            html += `<div class="search-view-all" onmousedown="viewAllResults('${query}')">Xem tất cả kết quả cho "${query}" →</div>`;
        }
        
        dropdown.innerHTML = html;
        dropdown.classList.add('show');
    }, 300);
}

function hideSearchResults() {
    setTimeout(() => {
        const dropdown = document.getElementById('searchDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }, 200);
}

function checkAuthAndRedirect(targetUrl) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Có thể lưu lại trang định truy cập để quay lại sau khi đăng nhập
        localStorage.setItem('redirectAfterLogin', targetUrl);
        window.location.href = 'login.html';
        return false;
    }
    if (targetUrl) {
        window.location.href = targetUrl;
    }
    return true;
}

function goToProduct(productId) {
    checkAuthAndRedirect(`product-detail.html?id=${productId}`);
}

function viewAllResults(query) {
    window.location.href = `products.html?search=${encodeURIComponent(query)}`;
}

function performSearch() {
    const inputs = ['searchInputHome', 'searchInputBlog', 'searchInputProducts'];
    let query = '';
    
    for (let inputId of inputs) {
        const input = document.getElementById(inputId);
        if (input && input.value) {
            query = input.value;
            break;
        }
    }
    
    if (query) {
        viewAllResults(query);
    }
}

function formatPrice(price) {
    return price.toLocaleString('vi-VN') + 'đ';
}


// Product Detail Functions
function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }
    
    const product = products.find(p => (p._id || p.id) == productId);
    
    if (!product) {
        window.location.href = 'products.html';
        return;
    }
    
    // Update page content
    document.getElementById('productBreadcrumb').textContent = product.name;
    document.getElementById('productImage').src = product.image;
    document.getElementById('productImage').alt = product.name;
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productSold').textContent = product.sold || 0;
    document.getElementById('productBadge').textContent = product.badge || 'NEW';
    
    // Set badge color
    const badge = document.getElementById('productBadge');
    if (product.badge === 'HOT') {
        badge.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a6f)';
    } else if (product.badge === 'NEW') {
        badge.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    } else if (product.badge === 'SALE') {
        badge.style.background = 'linear-gradient(135deg, #f093fb, #f5576c)';
    } else if (product.badge === 'VIP') {
        badge.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
        badge.style.color = '#333';
    }
    
    // Load variants
    loadProductVariants(product);
    
    // Fill price display
    const priceDisplay = document.getElementById('priceDisplay');
    if (priceDisplay) {
        priceDisplay.innerHTML = `<span class="price-current">${formatPrice(product.price)}</span>`;
    }
    
    // Fill variant count
    const variantCount = document.getElementById('variantCount');
    if (variantCount) variantCount.textContent = '4';
    
    // Set description
    const description = getProductDescription(product);
    document.getElementById('productDescription').innerHTML = description;
    
    // Update page title
    document.title = product.name + ' - HangHoaMMO';
    
    // Load related products
    loadRelatedProducts(product);
    
    // Store current product for cart
    window.currentProduct = product;
}

function loadProductVariants(product) {
    const variantsContainer = document.getElementById('productVariants');
    
    // Create variants based on product
    const variants = [
        { name: '1 Tháng', price: product.price, duration: '1 tháng' },
        { name: '3 Tháng', price: product.price * 2.7, duration: '3 tháng', discount: '10%' },
        { name: '6 Tháng', price: product.price * 5, duration: '6 tháng', discount: '17%' },
        { name: '12 Tháng', price: product.price * 9, duration: '12 tháng', discount: '25%' }
    ];
    
    variantsContainer.innerHTML = variants.map((variant, index) => `
        <div class="variant-option ${index === 0 ? 'active' : ''}" onclick="selectVariant(${JSON.stringify(variant).replace(/"/g, '&quot;')}, this)">
            <span class="variant-name">${variant.name}</span>
            <span class="variant-price">${formatPrice(variant.price)}</span>
        </div>
    `).join('');
    
    // Set default selected variant
    if (window.selectVariant) {
        window.selectedVariant = variants[0];
    }
}

function getProductDescription(product) {
    // Generate description based on product category
    const descriptions = {
        'ai': `
            <p><strong>${product.name}</strong> là công cụ trí tuệ nhân tạo mạnh mẽ, giúp bạn:</p>
            <ul>
                <li>Trò chuyện thông minh và trả lời câu hỏi chính xác</li>
                <li>Tạo nội dung, viết bài chuyên nghiệp</li>
                <li>Hỗ trợ lập trình và debug code</li>
                <li>Học tập và làm việc hiệu quả hơn</li>
                <li>Tiết kiệm thời gian và nâng cao năng suất</li>
            </ul>
            <p><strong>Hướng dẫn sử dụng:</strong></p>
            <p>Sau khi đặt hàng, bạn sẽ nhận được hướng dẫn chi tiết qua email hoặc tin nhắn. Sản phẩm được kích hoạt ngay trên tài khoản của bạn, sử dụng riêng tư và bảo mật tuyệt đối.</p>
            <p><strong>Chính sách bảo hành:</strong></p>
            <p>Sản phẩm được bảo hành đầy đủ theo thời gian gói đã mua. Hỗ trợ 24/7 qua Telegram hoặc Zalo.</p>
        `,
        'design': `
            <p><strong>${product.name}</strong> - Công cụ thiết kế chuyên nghiệp cho mọi nhu cầu:</p>
            <ul>
                <li>Chỉnh sửa video, ảnh chuyên nghiệp</li>
                <li>Hàng ngàn template có sẵn</li>
                <li>Xuất file chất lượng cao</li>
                <li>Sử dụng trên mọi thiết bị</li>
                <li>Cập nhật tính năng mới liên tục</li>
            </ul>
            <p><strong>Thông tin sản phẩm:</strong></p>
            <p>Tài khoản chính chủ, sử dụng riêng tư. Không giới hạn số lượng dự án. Hỗ trợ xuất file không watermark.</p>
            <p><strong>Bảo hành:</strong> Đầy đủ theo thời gian gói. Hỗ trợ kỹ thuật 24/7.</p>
        `,
        'entertainment': `
            <p><strong>${product.name}</strong> - Giải trí không giới hạn với:</p>
            <ul>
                <li>Thư viện nội dung khổng lồ</li>
                <li>Chất lượng cao nhất (4K, HDR)</li>
                <li>Xem trên mọi thiết bị</li>
                <li>Không quảng cáo</li>
                <li>Tải về xem offline</li>
            </ul>
            <p><strong>Hướng dẫn:</strong></p>
            <p>Sau khi đặt hàng, bạn sẽ nhận được thông tin tài khoản hoặc được thêm vào gói gia đình. Sử dụng ngay lập tức.</p>
            <p><strong>Bảo hành:</strong> Đầy đủ theo gói đã mua. Đổi mới nếu có lỗi.</p>
        `,
        'software': `
            <p><strong>${product.name}</strong> - Phần mềm chính hãng, giá tốt nhất:</p>
            <ul>
                <li>Bản quyền chính hãng 100%</li>
                <li>Cập nhật tự động</li>
                <li>Hỗ trợ đầy đủ tính năng</li>
                <li>Sử dụng lâu dài, ổn định</li>
                <li>Hỗ trợ kỹ thuật chuyên nghiệp</li>
            </ul>
            <p><strong>Kích hoạt:</strong></p>
            <p>Nhận key hoặc tài khoản ngay sau khi đặt hàng. Hướng dẫn chi tiết kèm theo.</p>
            <p><strong>Bảo hành:</strong> Theo thời gian gói. Hỗ trợ 24/7.</p>
        `,
        'vpn': `
            <p><strong>${product.name}</strong> - Truy cập internet tự do và an toàn:</p>
            <ul>
                <li>Tốc độ cao, không giới hạn băng thông</li>
                <li>Bảo mật tuyệt đối</li>
                <li>Truy cập mọi trang web</li>
                <li>Nhiều server toàn cầu</li>
                <li>Ổn định, không gián đoạn</li>
            </ul>
            <p><strong>Sử dụng:</strong></p>
            <p>Nhận thông tin kết nối ngay sau khi đặt hàng. Hỗ trợ mọi thiết bị và hệ điều hành.</p>
            <p><strong>Bảo hành:</strong> Đầy đủ theo gói. Đổi mới nếu lỗi.</p>
        `,
        'service': `
            <p><strong>${product.name}</strong> - Dịch vụ chuyên nghiệp, uy tín:</p>
            <ul>
                <li>Thực hiện bởi chuyên gia</li>
                <li>An toàn, không vi phạm</li>
                <li>Hiệu quả cao</li>
                <li>Giá cả hợp lý</li>
                <li>Bảo hành đầy đủ</li>
            </ul>
            <p><strong>Quy trình:</strong></p>
            <p>Sau khi đặt hàng, team sẽ liên hệ để xác nhận thông tin và tiến hành thực hiện dịch vụ.</p>
            <p><strong>Bảo hành:</strong> Theo cam kết. Hỗ trợ 24/7.</p>
        `
    };
    
    return descriptions[product.category] || `
        <p><strong>${product.name}</strong></p>
        <p>Sản phẩm chất lượng cao, giá tốt nhất thị trường. Bảo hành đầy đủ, hỗ trợ 24/7.</p>
        <p>Liên hệ shop để được tư vấn chi tiết.</p>
    `;
}

function loadRelatedProducts(currentProduct) {
    const related = products
        .filter(p => p.category === currentProduct.category && (p._id || p.id) !== (currentProduct._id || currentProduct.id))
        .slice(0, 4);
    
    const container = document.getElementById('relatedProducts');
    if (!container) return;
    
    container.innerHTML = related.map(product => {
        const productId = product._id || product.id;
        return `
            <div class="product-card-explore" onclick="viewProductDetail('${productId}')" style="cursor: pointer;">
                <div class="product-image-explore">
                    <img src="${product.image}" alt="${product.name}">
                    ${product.badge ? `<span class="badge-explore ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                </div>
                <div class="product-info-explore">
                    <h3 class="product-name-explore">${product.name}</h3>
                    <div class="product-price-explore">
                        <span class="price-current">${formatPrice(product.price)}</span>
                    </div>
                    <div class="product-meta-explore">
                        <div class="rating-explore">
                            <i class="fas fa-star"></i>
                            <span>5.0</span>
                        </div>
                        <span class="sold-explore">Đã bán ${product.sold || 0}</span>
                    </div>
                    <div class="product-vendor-explore">
                        <img src="https://ui-avatars.com/api/?name=Manh98&background=667eea&color=fff&size=32" alt="Vendor">
                        <span>Mạnh98</span>
                    </div>
                    <div class="product-actions-home">
                        <button class="btn-view-detail-home" onclick="event.stopPropagation(); viewProductDetail('${productId}')">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        <button class="btn-add-cart-home" onclick="event.stopPropagation(); addToCart('${productId}')">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCartFromDetail() {
    if (window.currentProduct) {
        addToCart(window.currentProduct._id || window.currentProduct.id);
    }
}

function buyNow() {
    // Kiểm tra đăng nhập
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        showNotification('Vui lòng đăng nhập để mua hàng!', 'error');
        setTimeout(() => {
            openAuthModal('login');
        }, 500);
        return;
    }
    
    if (window.currentProduct) {
        addToCart(window.currentProduct._id || window.currentProduct.id);
        setTimeout(() => {
            checkout();
        }, 500);
    }
}

function viewProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}


// Checkout Functions
function loadCheckoutItems() {
    const container = document.getElementById('checkoutItems');
    if (!container) return;
    
    // Update breadcrumb count
    const breadcrumbCount = document.getElementById('breadcrumbCount');
    if (breadcrumbCount) {
        breadcrumbCount.textContent = cart.length;
    }
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <button class="btn-shop-now" onclick="window.location.href='products.html'">
                    Mua sắm ngay
                </button>
            </div>
        `;
        updateCheckoutSummary();
        return;
    }
    
    // Group items by vendor
    const groupedItems = {};
    cart.forEach(item => {
        const vendor = 'Mạnh98'; // Default vendor
        if (!groupedItems[vendor]) {
            groupedItems[vendor] = [];
        }
        groupedItems[vendor].push(item);
    });
    
    let html = '';
    Object.keys(groupedItems).forEach(vendor => {
        html += `
            <div class="checkout-vendor-group">
                <div class="checkout-item-vendor">
                    <img src="https://ui-avatars.com/api/?name=${vendor}&background=667eea&color=fff" alt="${vendor}">
                    <span>${vendor}</span>
                </div>
        `;
        
        groupedItems[vendor].forEach(item => {
            html += `
                <div class="checkout-item">
                    <div class="checkout-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="checkout-item-info">
                        <div class="checkout-item-name">${item.name}</div>
                        <div class="checkout-item-price">
                            ${formatPrice(item.price)}
                        </div>
                        <div class="checkout-item-quantity">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantityCheckout('${item._id || item.id}', -1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-value">${item.quantity}</span>
                                <button class="quantity-btn" onclick="updateQuantityCheckout('${item._id || item.id}', 1)">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button class="checkout-item-remove" onclick="removeFromCartCheckout('${item._id || item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    updateCheckoutSummary();
}

function updateCheckoutSummary() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const totalItemsEl = document.getElementById('totalItemsCount');
    const subtotalEl = document.getElementById('subtotalAmount');
    const totalEl = document.getElementById('totalAmount');
    
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

function updateQuantityCheckout(productId, change) {
    const item = cart.find(item => (item._id || item.id) == productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCartCheckout(productId);
            return;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCheckoutItems();
        updateCartCount();
    }
}

function removeFromCartCheckout(productId) {
    cart = cart.filter(item => (item._id || item.id) != productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCheckoutItems();
    updateCartCount();
    showNotification('Đã xóa sản phẩm khỏi giỏ hàng');
}

function processCheckout() {
    if (cart.length === 0) {
        showNotification('Giỏ hàng trống!', 'error');
        return;
    }
    
    // Generate order ID
    const orderId = 'DH' + Date.now().toString().slice(-8);
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = {
        id: orderId,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString(),
        status: 'pending'
    };
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show success modal
    document.getElementById('orderId').textContent = orderId;
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function viewOrders() {
    closePaymentModal();
    // Redirect to orders page (to be created)
    window.location.href = 'index.html';
}

function continueShopping() {
    closePaymentModal();
    window.location.href = 'products.html';
}

function checkout() {
    // Kiểm tra đăng nhập
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        showNotification('Vui lòng đăng nhập để thanh toán!', 'error');
        setTimeout(() => {
            openAuthModal('login');
        }, 500);
        return;
    }
    
    // Kiểm tra giỏ hàng
    if (cart.length === 0) {
        showNotification('Giỏ hàng trống! Vui lòng thêm sản phẩm.', 'error');
        return;
    }
    
    window.location.href = 'checkout.html';
}


// Maintenance Banner Functions
// Maintenance Banner Functions - Check from API
async function checkMaintenanceMode() {
    try {
        // Gọi API để lấy trạng thái real-time từ server
        const response = await fetch('/api/maintenance/status');
        const result = await response.json();
        
        if (!result.success) {
            console.log('Failed to fetch maintenance status');
            return;
        }
        
        const { enabled, message, eta, telegram } = result.data;
        const bannerClosed = sessionStorage.getItem('maintenanceBannerClosed') === 'true';
        
        const banner = document.getElementById('maintenanceBanner');
        const messageEl = document.getElementById('maintenanceText');
        const etaEl = document.getElementById('maintenanceETA');
        const telegramEl = document.getElementById('maintenanceTelegram');
        
        if (banner && enabled && !bannerClosed) {
            if (messageEl) {
                messageEl.textContent = message || 'Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn cho bạn. Vui lòng quay lại sau ít phút.';
            }
            if (etaEl) {
                etaEl.textContent = eta || '30 phút';
            }
            if (telegramEl) {
                telegramEl.href = telegram || 'https://t.me/hanghoammo';
            }
            banner.style.display = 'block';
        } else if (banner && !enabled) {
            // Nếu admin tắt banner, ẩn ngay lập tức
            banner.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // Fallback to localStorage if API fails
        const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
        const bannerClosed = sessionStorage.getItem('maintenanceBannerClosed') === 'true';
        const banner = document.getElementById('maintenanceBanner');
        
        if (banner && maintenanceMode && !bannerClosed) {
            banner.style.display = 'block';
        }
    }
}

function closeMaintenanceBanner() {
    const banner = document.getElementById('maintenanceBanner');
    if (banner) {
        banner.style.animation = 'slideUpFade 0.5s ease forwards';
        setTimeout(() => {
            banner.style.display = 'none';
            sessionStorage.setItem('maintenanceBannerClosed', 'true');
        }, 500);
    }
}

// Auto-check maintenance status every 30 seconds
setInterval(checkMaintenanceMode, 30000);

// Add slide up animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUpFade {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Check maintenance mode on page load
document.addEventListener('DOMContentLoaded', function() {
    checkMaintenanceMode();
});


// Telegram Modal Functions
function openTelegramModal() {
    const modal = document.getElementById('telegramModal');
    if (!modal) {
        // If modal doesn't exist on this page, create it
        createTelegramModal();
    }
    document.getElementById('telegramModal').classList.add('active');
}

function closeTelegramModal() {
    document.getElementById('telegramModal').classList.remove('active');
    localStorage.setItem('telegramModalClosed', Date.now());
}

function joinTelegram() {
    // Get Telegram link from localStorage or use default
    const telegramLink = localStorage.getItem('shopTelegram') || 'https://t.me/hanghoammo';
    window.open(telegramLink, '_blank');
    closeTelegramModal();
    localStorage.setItem('telegramJoined', 'true');
}

function createTelegramModal() {
    const modalHTML = `
        <div class="telegram-modal" id="telegramModal">
            <div class="telegram-modal-content">
                <div class="telegram-modal-header">
                    <div class="telegram-icon">
                        <i class="fab fa-telegram-plane"></i>
                    </div>
                    <div class="telegram-header-text">
                        <h3>Tham gia Telegram</h3>
                        <p>Nhận thông báo cập nhật nhanh nhất</p>
                    </div>
                    <button class="telegram-modal-close" onclick="closeTelegramModal()">×</button>
                </div>
                <div class="telegram-modal-body">
                    <p class="telegram-description">
                        Tham gia kênh Telegram để nhận thông báo về <strong>tính năng mới, cập nhật hệ thống</strong>, và <strong>thông tin quan trọng</strong> ngay lập tức.
                    </p>
                    
                    <div class="telegram-channel-box">
                        <div class="telegram-channel-avatar">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="telegram-channel-info">
                            <h4>HangHoaMMO Channel</h4>
                            <p>@hanghoammo</p>
                        </div>
                        <a href="#" class="telegram-channel-link" target="_blank">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                    
                    <div class="telegram-info-box">
                        <p>
                            <i class="fas fa-info-circle"></i>
                            Chúng tôi sẽ gửi thông báo qua Telegram khi có <strong>tính năng mới, thay đổi chính sách</strong>, hoặc <strong>sự kiện đặc biệt</strong>. Không spam!
                        </p>
                    </div>
                </div>
                <div class="telegram-modal-footer">
                    <button class="btn-telegram-later" onclick="closeTelegramModal()">
                        Để sau
                    </button>
                    <button class="btn-telegram-join" onclick="joinTelegram()">
                        <i class="fab fa-telegram-plane"></i>
                        Tham gia ngay
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Auto show Telegram modal after 10 seconds (only once per day)
function autoShowTelegramModal() {
    const hasJoined = localStorage.getItem('telegramJoined');
    const lastClosed = localStorage.getItem('telegramModalClosed');
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Don't show if user already joined
    if (hasJoined === 'true') return;
    
    // Don't show if closed within last 24 hours
    if (lastClosed && (now - parseInt(lastClosed)) < oneDayMs) return;
    
    // Show modal after 10 seconds
    setTimeout(() => {
        openTelegramModal();
    }, 10000);
}

// Initialize Telegram modal on page load
document.addEventListener('DOMContentLoaded', function() {
    // Auto show modal (optional - comment out if you don't want auto-show)
    // autoShowTelegramModal();
});


// Check Login Status and Update Header
function checkLoginStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authButtons = document.getElementById('authButtons');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatarInitial = document.getElementById('userAvatarInitial');
    const walletLink = document.getElementById('walletLink');
    
    console.log('🔍 checkLoginStatus:', {
        hasUser: !!currentUser,
        userName: currentUser?.name || currentUser?.email,
        elementsFound: {
            authButtons: !!authButtons,
            userProfileBtn: !!userProfileBtn,
            userNameDisplay: !!userNameDisplay,
            userAvatarInitial: !!userAvatarInitial
        }
    });
    
    if (currentUser) {
        // User is logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userProfileBtn) {
            userProfileBtn.style.display = 'flex';
            console.log('✅ Showing user profile button');
        }
        if (walletLink) walletLink.style.display = 'flex';
        
        // Show affiliate link
        const affiliateLink = document.getElementById('affiliateLink');
        if (affiliateLink) affiliateLink.style.display = 'flex';
        
        // Show reseller link
        const resellerLink = document.getElementById('resellerLink');
        if (resellerLink) resellerLink.style.display = 'flex';
        
        // Load tier info for logged in user
        loadUserTierInfo();
        
        const displayName = currentUser.name || currentUser.email.split('@')[0];
        if (userNameDisplay) {
            userNameDisplay.textContent = displayName;
            console.log('✅ Set display name:', displayName);
        }
        if (userAvatarInitial) {
            userAvatarInitial.textContent = displayName.charAt(0).toUpperCase();
            console.log('✅ Set avatar initial:', displayName.charAt(0).toUpperCase());
        }
        
        // Update dropdown info
        const userNameDropdown = document.getElementById('userNameDropdown');
        const userAvatarLarge = document.getElementById('userAvatarLarge');
        if (userNameDropdown) userNameDropdown.textContent = displayName;
        if (userAvatarLarge) userAvatarLarge.textContent = displayName.charAt(0).toUpperCase();
    } else {
        // User is not logged in
        console.log('❌ No user logged in');
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfileBtn) userProfileBtn.style.display = 'none';
        if (walletLink) walletLink.style.display = 'none';
        
        // Hide affiliate link
        const affiliateLink = document.getElementById('affiliateLink');
        if (affiliateLink) affiliateLink.style.display = 'none';
        
        // Hide reseller link
        const resellerLink = document.getElementById('resellerLink');
        if (resellerLink) resellerLink.style.display = 'none';
    }
}

// Update login function to refresh header
function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        const authToken = 'token_' + Date.now();
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        closeAuthModal();
        showNotification('Đăng nhập thành công!');
        
        // Update header
        checkLoginStatus();
        
        return true;
    }
    return false;
}

// Update register function to refresh header
function registerUser(email, password, confirmPassword) {
    if (password !== confirmPassword) {
        showNotification('Mật khẩu không khớp!', 'error');
        return false;
    }
    
    // Kiểm tra độ dài mật khẩu
    if (password.length < 8) {
        showNotification('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
        return false;
    }
    
    // Kiểm tra mật khẩu mạnh: phải có chữ hoa, chữ thường, số
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        showNotification('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số!', 'error');
        return false;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showNotification('Email đã được sử dụng!', 'error');
        return false;
    }
    
    const newUser = {
        email,
        password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after register
    const authToken = 'token_' + Date.now();
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    closeAuthModal();
    showNotification('Đăng ký thành công!');
    
    // Update header
    checkLoginStatus();
    
    return true;
}

// Check login status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});


// ==================== QUICK SEARCH FUNCTIONS ====================

let allProducts = [];

// Load products for search
async function loadProductsForSearch() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.success) {
            allProducts = data.data || [];
        }
    } catch (error) {
        console.error('Load products error:', error);
    }
}

// Quick search with live results
function quickSearch(query) {
    if (!query || query.trim().length < 2) {
        hideQuickSearchResults();
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.category && product.category.toLowerCase().includes(searchTerm))
    ).slice(0, 5); // Limit to 5 results
    
    showQuickSearchResults(results);
}

// Show quick search results dropdown
function showQuickSearchResults(results) {
    const input = document.getElementById('quickSearchInput');
    if (!input) return;
    
    let dropdown = document.getElementById('quickSearchDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'quickSearchDropdown';
        dropdown.className = 'quick-search-dropdown';
        input.parentElement.appendChild(dropdown);
    }
    
    if (results.length === 0) {
        dropdown.innerHTML = `
            <div class="search-result-item no-results">
                <i class="fas fa-search"></i>
                <span>Không tìm thấy sản phẩm</span>
            </div>
        `;
    } else {
        dropdown.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="goToProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}">
                <div class="search-result-info">
                    <div class="search-result-name">${product.name}</div>
                    <div class="search-result-price">${formatPrice(product.price)}</div>
                </div>
            </div>
        `).join('');
    }
    
    dropdown.style.display = 'block';
}

// Hide quick search results
function hideQuickSearchResults() {
    const dropdown = document.getElementById('quickSearchDropdown');
    if (dropdown) {
        setTimeout(() => {
            dropdown.style.display = 'none';
        }, 200);
    }
}

// Go to product detail
function goToProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Perform quick search (Enter or button click)
function performQuickSearch() {
    const query = document.getElementById('quickSearchInput')?.value.trim();
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

// Filter products by category
function filterByCategory(category) {
    if (category === 'all') {
        window.location.href = 'products.html';
    } else {
        window.location.href = `products.html?category=${category}`;
    }
}

// Add Enter key listener for quick search
document.addEventListener('DOMContentLoaded', function() {
    // Load products for search
    loadProductsForSearch();
    
    const quickSearchInput = document.getElementById('quickSearchInput');
    if (quickSearchInput) {
        quickSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performQuickSearch();
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!quickSearchInput.contains(e.target)) {
                hideQuickSearchResults();
            }
        });
    }
});

// Reset Rate Limit (Development only)
async function resetRateLimit() {
    try {
        const response = await fetch('/api/reset-rate-limit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Đã reset rate limit thành công!', 'success');
        } else {
            showNotification(result.message || 'Không thể reset rate limit', 'error');
        }
    } catch (error) {
        console.error('Reset rate limit error:', error);
        showNotification('Lỗi khi reset rate limit', 'error');
    }
}

// Show reset button in development
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in development (localhost or specific domains)
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('dev');
    
    if (isDevelopment) {
        const resetButton = document.querySelector('.btn-reset-rate-limit');
        if (resetButton) {
            resetButton.style.display = 'block';
        }
    }
});

// =====================================================
// TIER SYSTEM FUNCTIONS
// =====================================================

// Load user tier information
async function loadUserTierInfo() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/reseller/my-tier', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (result.success) {
            updateTierDisplay(result.data);
            showTierUpgradeBanner(result.data);
        }
    } catch (error) {
        console.error('Error loading tier info:', error);
    }
}

// Update tier display in header
function updateTierDisplay(tierData) {
    const tierIndicator = document.getElementById('tierIndicator');
    const userTierDropdown = document.getElementById('userTierDropdown');
    const tierBenefitsDropdown = document.getElementById('tierBenefitsDropdown');
    
    if (tierData.current_tier) {
        const tier = tierData.current_tier;
        
        // Update tier indicator dot
        if (tierIndicator) {
            tierIndicator.className = `tier-indicator tier-${tier.tier_name}`;
        }
        
        // Update dropdown info
        if (userTierDropdown) {
            userTierDropdown.textContent = tier.display_name;
            userTierDropdown.className = `tier-badge-dropdown tier-${tier.tier_name}`;
        }
        
        if (tierBenefitsDropdown) {
            tierBenefitsDropdown.textContent = `Giảm ${tier.discount_percent}% • Hoa hồng ${tier.commission_percent}%`;
        }
    }
}

// Show tier upgrade banner
function showTierUpgradeBanner(tierData) {
    const banner = document.getElementById('tierUpgradeBanner');
    if (!banner) return;

    const { current_tier, next_tier, progress } = tierData;
    
    // Update banner content
    const bannerCurrentTier = document.getElementById('bannerCurrentTier');
    const bannerDiscount = document.getElementById('bannerDiscount');
    const bannerCommission = document.getElementById('bannerCommission');
    
    if (bannerCurrentTier) bannerCurrentTier.textContent = current_tier.display_name;
    if (bannerDiscount) bannerDiscount.textContent = `Giảm ${current_tier.discount_percent}%`;
    if (bannerCommission) bannerCommission.textContent = `Hoa hồng ${current_tier.commission_percent}%`;

    const upgradeMessage = document.getElementById('upgradeMessage');
    const upgradeAmount = document.getElementById('upgradeAmount');
    const upgradeNextTier = document.getElementById('upgradeNextTier');
    const upgradeProgressFill = document.getElementById('upgradeProgressFill');

    if (next_tier && progress) {
        if (upgradeAmount) upgradeAmount.textContent = progress.remaining.toLocaleString('vi-VN') + 'đ';
        if (upgradeNextTier) upgradeNextTier.textContent = next_tier.display_name;
        if (upgradeProgressFill) upgradeProgressFill.style.width = `${progress.percent}%`;
        
        // Show banner
        banner.style.display = 'block';
    } else {
        // Max tier reached
        if (upgradeMessage) {
            upgradeMessage.innerHTML = 'Bạn đã đạt cấp cao nhất! <strong>Tận hưởng ưu đãi tối đa</strong>';
        }
        if (upgradeProgressFill) upgradeProgressFill.style.width = '100%';
        banner.style.display = 'block';
    }
}

// Load products with tier pricing
async function loadProductsWithTierPricing() {
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/products', { headers });
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            return result.data;
        } else {
            // Use getSampleProducts from script.js
            return typeof getSampleProducts === 'function' ? getSampleProducts() : [];
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        // Use getSampleProducts from script.js
        return typeof getSampleProducts === 'function' ? getSampleProducts() : [];
    }
}
// =====================================================
// USER DROPDOWN FUNCTIONS
// =====================================================

// Logout function
function logout() {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Show notification
    showNotification('Đã đăng xuất thành công!');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userProfileBtn && userDropdown) {
        if (!userProfileBtn.contains(e.target)) {
            userDropdown.style.opacity = '0';
            userDropdown.style.visibility = 'hidden';
            userDropdown.style.transform = 'translateY(-10px)';
        }
    }
});

// Prevent dropdown from closing when clicking inside
document.addEventListener('DOMContentLoaded', function() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});
