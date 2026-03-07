// Checkout New JavaScript
let currentStep = 1;
let userBalance = 500000; // Mock user balance

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập trước
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        alert('Vui lòng đăng nhập để thanh toán!');
        window.location.href = 'index.html';
        return;
    }
    
    loadCheckoutData();
    updateAllSummaries();
    checkLoginStatus(); // Cập nhật trạng thái đăng nhập
});

function loadCheckoutData() {
    loadCartItems();
    checkBalance();
}

function loadCartItems() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-checkout">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <button class="btn-next-step" onclick="window.location.href='products.html'">
                    <i class="fas fa-shopping-bag"></i>
                    Mua sắm ngay
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item-checkout">
            <div class="cart-item-vendor-tag">
                <img src="https://ui-avatars.com/api/?name=TH+Agency&background=667eea&color=fff&size=32" alt="Vendor">
                <span>TH Agency</span>
            </div>
            <div class="cart-item-image-checkout">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info-checkout">
                <div class="cart-item-name-checkout">${item.name}</div>
                <div class="cart-item-quantity-info">Số lượng: ${item.quantity}</div>
                <div class="cart-item-price-checkout">${formatPrice(item.price * item.quantity)}</div>
            </div>
            <button class="cart-item-remove-checkout" onclick="removeItemCheckout('${item._id || item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function removeItemCheckout(productId) {
    cart = cart.filter(item => (item._id || item.id) != productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateAllSummaries();
    updateCartCount();
    
    if (cart.length === 0) {
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1500);
    }
}

function updateAllSummaries() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update all summary sections
    for (let i = 1; i <= 2; i++) {
        const countEl = document.getElementById(`summaryCount${i}`);
        const subtotalEl = document.getElementById(`summarySubtotal${i}`);
        const totalEl = document.getElementById(`summaryTotal${i}`);
        const productsEl = document.getElementById(`summaryProducts${i}`);
        
        if (countEl) countEl.textContent = totalItems;
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (totalEl) totalEl.textContent = formatPrice(subtotal);
        
        if (productsEl) {
            productsEl.innerHTML = cart.slice(0, 4).map(item => `
                <div class="summary-product-thumb">
                    <img src="${item.image}" alt="${item.name}">
                </div>
            `).join('');
        }
    }
}

function checkBalance() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const balanceEl = document.getElementById('walletBalance');
    const warningEl = document.getElementById('balanceWarning');
    const needAmountEl = document.getElementById('needAmount');
    
    if (balanceEl) {
        balanceEl.textContent = formatPrice(userBalance);
    }
    
    if (warningEl && needAmountEl) {
        if (userBalance < total) {
            const needAmount = total - userBalance;
            needAmountEl.textContent = formatPrice(needAmount);
            warningEl.style.display = 'flex';
        } else {
            warningEl.style.display = 'none';
        }
    }
}

function goToStep(step) {
    if (step === 2 && cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    
    if (step === 3) {
        // Check balance before proceeding
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (userBalance < total) {
            alert('Số dư không đủ! Vui lòng nạp thêm tiền.');
            return;
        }
        
        // Process payment
        processPayment();
    }
    
    currentStep = step;
    
    // Update steps indicator
    document.querySelectorAll('.step-item').forEach((item, index) => {
        item.classList.remove('active', 'completed');
        if (index + 1 < step) {
            item.classList.add('completed');
        } else if (index + 1 === step) {
            item.classList.add('active');
        }
    });
    
    // Update step content
    document.querySelectorAll('.checkout-step').forEach((stepEl, index) => {
        stepEl.classList.remove('active');
        if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function processPayment() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = 'DH' + Date.now().toString().slice(-8);
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = {
        id: orderId,
        items: [...cart],
        total: total,
        date: new Date().toISOString(),
        status: 'paid',
        note: document.getElementById('orderNote')?.value || '',
        deliveredAccounts: []
    };
    
    // Auto-deliver accounts
    const productAccounts = JSON.parse(localStorage.getItem('productAccounts')) || {};
    
    cart.forEach(item => {
        const productId = item._id || item.id;
        const accounts = productAccounts[productId] || [];
        
        // Find available accounts for this product
        for (let i = 0; i < item.quantity; i++) {
            const availableAccount = accounts.find(acc => acc.status === 'available');
            
            if (availableAccount) {
                // Mark as sold
                availableAccount.status = 'sold';
                availableAccount.orderId = orderId;
                availableAccount.soldAt = new Date().toISOString();
                
                // Add to delivered accounts
                order.deliveredAccounts.push({
                    productName: item.name,
                    account: availableAccount.account,
                    password: availableAccount.password
                });
            }
        }
    });
    
    // Save updated accounts
    localStorage.setItem('productAccounts', JSON.stringify(productAccounts));
    
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Save to admin orders
    let adminOrders = JSON.parse(localStorage.getItem('adminOrders')) || [];
    adminOrders.unshift(order);
    localStorage.setItem('adminOrders', JSON.stringify(adminOrders));
    
    // Update balance
    userBalance -= total;
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show order ID and accounts
    document.getElementById('finalOrderId').textContent = orderId;
    
    // Display delivered accounts if any
    if (order.deliveredAccounts.length > 0) {
        const accountsDisplay = document.getElementById('deliveredAccountsDisplay');
        if (accountsDisplay) {
            let accountsHTML = '<div class="delivered-accounts"><h4>Tài khoản của bạn:</h4>';
            order.deliveredAccounts.forEach(acc => {
                accountsHTML += `
                    <div class="account-item">
                        <strong>${acc.productName}</strong><br>
                        Tài khoản: <code>${acc.account}</code><br>
                        Mật khẩu: <code>${acc.password}</code>
                    </div>
                `;
            });
            accountsHTML += '</div>';
            accountsDisplay.innerHTML = accountsHTML;
        }
    }
}

function applyDiscount() {
    const code = document.getElementById('discountCode').value.trim();
    if (!code) {
        alert('Vui lòng nhập mã giảm giá!');
        return;
    }
    
    // Mock discount validation
    if (code.toUpperCase() === 'DISCOUNT10') {
        alert('Áp dụng mã giảm giá thành công! Giảm 10%');
    } else {
        alert('Mã giảm giá không hợp lệ!');
    }
}

function viewOrders() {
    window.location.href = 'index.html';
}

function continueShopping() {
    window.location.href = 'products.html';
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
