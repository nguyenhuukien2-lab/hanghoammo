// API Configuration
const API_URL = '/api';
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Products Data
let products = [];

// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
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
        
        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load products from API or localStorage
async function loadProducts() {
    // Force reload sample products (remove this line after first load if needed)
    products = getSampleProducts();
    localStorage.setItem('adminProducts', JSON.stringify(products));
    console.log('✅ Loaded ' + products.length + ' products');
    return products;
}

// Sample products fallback
function getSampleProducts() {
    return [
        {
            _id: '1',
            id: 1,
            name: "CapCut Pro giá rẻ tuyệt đối",
            category: "design",
            price: 7000,
            image: "https://play-lh.googleusercontent.com/3aWGqSf3T_p3F6wc8FFvcZcnjWlxpZdNaqHVNAqBFXvfRCyXYBiCwC-KXNR5p6LCnA=w240-h480-rw",
            badge: "HOT",
            sold: 125
        },
        {
            _id: '2',
            id: 2,
            name: "ChatGPT Pro giá rẻ hơn gốc chưởi",
            category: "ai",
            price: 40000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png",
            badge: "HOT",
            sold: 234
        },
        {
            _id: '3',
            id: 3,
            name: "Canva Education 1 năm BHF",
            category: "design",
            price: 8000,
            image: "https://static-00.iconduck.com/assets.00/canva-icon-2048x2048-g0kwfohy.png",
            badge: "NEW",
            sold: 89
        },
        {
            _id: '4',
            id: 4,
            name: "Nâng Cấp Gemini AI Pro 1 năm giá chỉnh rơi",
            category: "ai",
            price: 25000,
            image: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
            badge: "NEW",
            sold: 156
        },
        {
            _id: '5',
            id: 5,
            name: "CAPCUT PRO 3 THIẾT BỊ - DÙNG RIÊNG",
            category: "design",
            price: 9000,
            image: "https://play-lh.googleusercontent.com/3aWGqSf3T_p3F6wc8FFvcZcnjWlxpZdNaqHVNAqBFXvfRCyXYBiCwC-KXNR5p6LCnA=w240-h480-rw",
            badge: "VIP",
            sold: 198
        },
        {
            _id: '6',
            id: 6,
            name: "Netflix Premium 4K - 1 tháng",
            category: "entertainment",
            price: 45000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1920px-Netflix_2015_logo.svg.png",
            badge: "SALE",
            sold: 312
        },
        {
            _id: '7',
            id: 7,
            name: "Spotify Premium - Nghe nhạc không giới hạn",
            category: "entertainment",
            price: 35000,
            image: "https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png",
            badge: "HOT",
            sold: 267
        },
        {
            _id: '8',
            id: 8,
            name: "Microsoft Office 365 - 1 năm",
            category: "software",
            price: 180000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/1200px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png",
            badge: "HOT",
            sold: 189
        },
        {
            _id: '9',
            id: 9,
            name: "Dịch Vụ Đánh Giá Google Map 5 Sao Uy Tín - Giá Rẻ",
            category: "service",
            price: 25000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Google_Maps_Logo_2020.svg/1200px-Google_Maps_Logo_2020.svg.png",
            badge: "HOT",
            sold: 445
        },
        {
            _id: '10',
            id: 10,
            name: "PROXY IPV4 VIỆT NAM - 30 NGÀY",
            category: "vpn",
            price: 1000,
            image: "https://cdn-icons-png.flaticon.com/512/2976/2976286.png",
            badge: "SALE",
            sold: 678
        },
        {
            _id: '11',
            id: 11,
            name: "Tài Khoản ChatGPT Plus - ChatGPT Go - ChatGPT Business",
            category: "ai",
            price: 45000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png",
            badge: "VIP",
            sold: 523
        },
        {
            _id: '12',
            id: 12,
            name: "Nâng Youtube Premium Chính Chủ Có Bảo Hành",
            category: "entertainment",
            price: 20000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/YouTube_social_white_square_%282017%29.svg/2048px-YouTube_social_white_square_%282017%29.svg.png",
            badge: "HOT",
            sold: 892
        },
        {
            _id: '13',
            id: 13,
            name: "Tài Khoản Gemini Pro - Google One 2TB Năng Chính Chủ Mai...",
            category: "ai",
            price: 50000,
            image: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
            badge: "VIP",
            sold: 334
        },
        {
            _id: '14',
            id: 14,
            name: "Canva Pro 1 Năm - Thiết Kế Chuyên Nghiệp",
            category: "design",
            price: 15000,
            image: "https://static-00.iconduck.com/assets.00/canva-icon-2048x2048-g0kwfohy.png",
            badge: "NEW",
            sold: 567
        },
        {
            _id: '15',
            id: 15,
            name: "Adobe Creative Cloud All Apps - 1 Tháng",
            category: "design",
            price: 120000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Adobe_Creative_Cloud_rainbow_icon.svg/2101px-Adobe_Creative_Cloud_rainbow_icon.svg.png",
            badge: "VIP",
            sold: 145
        },
        {
            _id: '16',
            id: 16,
            name: "Grammarly Premium - Viết Tiếng Anh Chuẩn",
            category: "software",
            price: 30000,
            image: "https://static.grammarly.com/assets/files/efe8d7f0d7c44c7c1e9b9fa34f4e3d99/grammarly_app_icon.svg",
            badge: "NEW",
            sold: 234
        },
        {
            _id: '17',
            id: 17,
            name: "VPN Premium - Truy Cập Mọi Trang Web",
            category: "vpn",
            price: 25000,
            image: "https://cdn-icons-png.flaticon.com/512/2313/2313888.png",
            badge: "HOT",
            sold: 789
        },
        {
            _id: '18',
            id: 18,
            name: "Midjourney Pro - AI Tạo Ảnh Đỉnh Cao",
            category: "ai",
            price: 55000,
            image: "https://styles.redditmedia.com/t5_5smhl7/styles/communityIcon_yyg95v0z5jq91.png",
            badge: "VIP",
            sold: 412
        },
        {
            _id: '19',
            id: 19,
            name: "Notion Premium - Quản Lý Công Việc Hiệu Quả",
            category: "software",
            price: 20000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/2048px-Notion-logo.svg.png",
            badge: "NEW",
            sold: 356
        },
        {
            _id: '20',
            id: 20,
            name: "Disney+ Premium - Xem Phim Không Giới Hạn",
            category: "entertainment",
            price: 40000,
            image: "https://static-assets.bamgrid.com/product/disneyplus/favicons/favicon.85cf084a56c5a3d90f38.ico",
            badge: "HOT",
            sold: 278
        },
        {
            _id: '21',
            id: 21,
            name: "GitHub Copilot - AI Code Assistant",
            category: "software",
            price: 35000,
            image: "https://github.githubassets.com/images/modules/site/copilot/copilot.png",
            badge: "VIP",
            sold: 189
        },
        {
            _id: '22',
            id: 22,
            name: "Figma Professional - Thiết Kế UI/UX",
            category: "design",
            price: 28000,
            image: "https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png",
            badge: "NEW",
            sold: 423
        },
        {
            _id: '23',
            id: 23,
            name: "Telegram Premium - Tính Năng Cao Cấp",
            category: "software",
            price: 15000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png",
            badge: "HOT",
            sold: 612
        },
        {
            _id: '24',
            id: 24,
            name: "Apple Music - 3 Tháng",
            category: "entertainment",
            price: 38000,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Apple_Music_icon.svg/2048px-Apple_Music_icon.svg.png",
            badge: "SALE",
            sold: 345
        }
    ];
}

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
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        switchAuthTab(tab);
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
    const resetForm = document.getElementById('modalResetForm');
    const title = document.getElementById('authModalTitle');
    const subtitle = document.getElementById('authModalSubtitle');
    
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    if (forgotForm) forgotForm.classList.remove('active');
    if (resetForm) resetForm.style.display = 'none';
    
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
        if (forgotForm) forgotForm.classList.add('active');
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
            try {
                const data = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                authToken = data.token;
                currentUser = data.user;
            } catch (apiError) {
                console.log('API not available, checking localStorage');
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.email === email && u.password === password);
                
                if (!user) {
                    throw new Error('Email hoặc mật khẩu không đúng!');
                }
                
                currentUser = { name: user.name, email: user.email, phone: user.phone };
                authToken = 'local_' + Date.now();
            }
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Đăng nhập thành công!');
            closeAuthModal();
            updateUserUI();
            checkLoginStatus();
        } catch (error) {
            showNotification(error.message || 'Đăng nhập thất bại!', 'error');
        } finally {
            btnSubmit.innerHTML = originalHTML;
            btnSubmit.disabled = false;
        }
    });
}

// Modal Register Form Handler
const modalRegisterForm = document.getElementById('modalRegisterForm');
if (modalRegisterForm) {
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
        
        if (password.length < 6) {
            showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }
        
        const btnSubmit = this.querySelector('.btn-submit');
        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';
        btnSubmit.disabled = true;
        
        try {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.email === email)) {
                throw new Error('Email đã được đăng ký!');
            }
            
            try {
                const data = await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, phone, password })
                });
                
                authToken = data.token;
                currentUser = data.user;
            } catch (apiError) {
                console.log('API not available, using localStorage');
                const newUser = {
                    id: users.length + 1,
                    name,
                    email,
                    phone,
                    password,
                    createdAt: new Date().toISOString()
                };
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                currentUser = { name, email, phone };
                authToken = 'local_' + Date.now();
            }
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Đăng ký thành công!');
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

// Update UI based on auth state
function updateUserUI() {
    const btnLogin = document.querySelector('.btn-auth.login');
    const btnRegister = document.querySelector('.btn-auth.register');
    
    if (currentUser && btnLogin && btnRegister) {
        btnLogin.innerHTML = `<i class="fas fa-user"></i><span>${currentUser.name}</span>`;
        btnLogin.onclick = null;
        btnRegister.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Đăng xuất</span>`;
        btnRegister.onclick = logout;
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
        
        showNotification('Đặt hàng thành công!');
        
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
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Update icon
    const icon = event.target.closest('button').querySelector('i');
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Load dark mode preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const darkModeBtn = document.querySelector('.btn-icon i.fa-moon');
        if (darkModeBtn) {
            darkModeBtn.classList.remove('fa-moon');
            darkModeBtn.classList.add('fa-sun');
        }
    }
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

function goToProduct(productId) {
    // For now, just add to cart or show details
    addToCart(productId);
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
    document.getElementById('productPrice').textContent = formatPrice(product.price);
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
    
    if (currentUser) {
        // User is logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userProfileBtn) userProfileBtn.style.display = 'flex';
        
        const displayName = currentUser.name || currentUser.email.split('@')[0];
        if (userNameDisplay) userNameDisplay.textContent = displayName;
        if (userAvatarInitial) userAvatarInitial.textContent = displayName.charAt(0).toUpperCase();
    } else {
        // User is not logged in
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfileBtn) userProfileBtn.style.display = 'none';
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
    
    if (password.length < 6) {
        showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
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
