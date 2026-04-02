// Checkout New JavaScript
let currentStep = 1;
let userBalance = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập trước
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        alert('Vui lòng đăng nhập để thanh toán!');
        window.location.href = 'index.html';
        return;
    }
    
    // Check if cart has old numeric IDs and clear it
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (currentCart.length > 0) {
        const hasOldIds = currentCart.some(item => {
            const id = item.id || item._id;
            return typeof id === 'number' || (typeof id === 'string' && id.length < 10);
        });
        
        if (hasOldIds) {
            console.warn('⚠️ Cart contains old numeric IDs. Clearing cart...');
            localStorage.removeItem('cart');
            cart = [];
            alert('Giỏ hàng đã được làm mới. Vui lòng thêm sản phẩm lại!');
            window.location.href = 'products.html';
            return;
        }
    }
    
    loadCheckoutData();
    updateAllSummaries();
    checkLoginStatus(); // Cập nhật trạng thái đăng nhập
    
    // Load payment methods
    if (typeof loadPaymentMethods === 'function') {
        loadPaymentMethods();
    }
});

async function loadCheckoutData() {
    loadCartItems();
    await fetchWalletBalance();
    checkBalance();
}

async function fetchWalletBalance() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/wallet', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            userBalance = result.data.balance;
        } else {
            console.error('Lỗi lấy số dư:', result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
    }
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
    
    // Calculate discount
    let discount = 0;
    if (appliedVoucherData) {
        discount = appliedVoucherData.discountAmount || 0;
    }
    
    const total = subtotal - discount;
    
    // Update all summary sections
    for (let i = 1; i <= 2; i++) {
        const countEl = document.getElementById(`summaryCount${i}`);
        const subtotalEl = document.getElementById(`summarySubtotal${i}`);
        const discountRowEl = document.getElementById(`discountRow${i}`);
        const discountEl = document.getElementById(`summaryDiscount${i}`);
        const totalEl = document.getElementById(`summaryTotal${i}`);
        const productsEl = document.getElementById(`summaryProducts${i}`);
        
        if (countEl) countEl.textContent = totalItems;
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        
        // Show/hide discount row
        if (discountRowEl && discountEl) {
            if (discount > 0) {
                discountRowEl.style.display = 'flex';
                discountEl.textContent = '-' + formatPrice(discount);
            } else {
                discountRowEl.style.display = 'none';
            }
        }
        
        if (totalEl) totalEl.textContent = formatPrice(total);
        
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate discount
    let discount = 0;
    if (appliedVoucherData) {
        discount = appliedVoucherData.discountAmount || 0;
    }
    
    const total = subtotal - discount;
    
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

async function goToStep(step) {
    if (step === 2 && cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    
    if (step === 2) {
        // Load payment methods when entering step 2
        if (typeof loadPaymentMethods === 'function') {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discount = appliedVoucherData ? (appliedVoucherData.discountAmount || 0) : 0;
            const total = subtotal - discount;
            loadPaymentMethods(total, userBalance);
        }
    }
    
    if (step === 3) {
        // Get selected payment method
        const selectedMethod = window.selectedPaymentMethod || 'wallet';
        
        // Calculate final total with discount
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = appliedVoucherData ? (appliedVoucherData.discountAmount || 0) : 0;
        const total = subtotal - discount;
        
        // Check balance only for wallet payment
        if (selectedMethod === 'wallet') {
            if (userBalance < total) {
                alert('Số dư không đủ! Vui lòng nạp thêm tiền hoặc chọn phương thức thanh toán khác.');
                return;
            }
        }
        
        // Process payment
        await processPayment();
        return; // Don't continue to step update if payment fails
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

async function processPayment() {
    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = appliedVoucherData ? (appliedVoucherData.discountAmount || 0) : 0;
        const total = subtotal - discount;
        
        const authToken = localStorage.getItem('authToken');
        const selectedMethod = window.selectedPaymentMethod || 'wallet';
        
        // Prepare order items
        const items = cart.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        }));
        
        // Handle different payment methods
        if (selectedMethod === 'vnpay' || selectedMethod === 'momo' || selectedMethod === 'zalopay') {
            // Create payment request
            const response = await fetch(`/api/payment/${selectedMethod}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'X-CSRF-Token': getCsrfToken()
                },
                body: JSON.stringify({
                    amount: total,
                    orderInfo: `Thanh toán đơn hàng HangHoaMMO`,
                    items: items
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Redirect to payment gateway
                window.location.href = result.data.paymentUrl;
            } else {
                alert(result.message || 'Lỗi khi tạo thanh toán!');
            }
            return;
        }
        
        // Wallet payment (default)
        const orderData = {
            items: items,
            total_amount: total,
            payment_method: 'wallet'
        };
        
        // Include voucher if applied
        if (appliedVoucherData && appliedVoucherData.voucher) {
            orderData.voucher_id = appliedVoucherData.voucher.id;
            orderData.voucher_code = appliedVoucherData.voucher.code;
            orderData.discount_amount = appliedVoucherData.discountAmount;
        }
        
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'X-CSRF-Token': getCsrfToken()
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local balance
            userBalance = result.data.new_balance;
            
            // Clear cart
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            // Show order ID
            document.getElementById('finalOrderId').textContent = result.data.order_code || result.data.order_id;
            
            // Display delivered accounts if any
            if (result.data.accounts && result.data.accounts.length > 0) {
                const accountsDisplay = document.getElementById('deliveredAccountsDisplay');
                if (accountsDisplay) {
                    let accountsHTML = '<div class="delivered-accounts"><h4>🎁 Tài khoản của bạn:</h4>';
                    result.data.accounts.forEach(acc => {
                        accountsHTML += `
                            <div class="account-item">
                                <strong>${acc.product_name}</strong><br>
                                <div class="account-info">
                                    <span>Tài khoản:</span> <code>${acc.username}</code>
                                    <button onclick="navigator.clipboard.writeText('${acc.username}')" class="btn-copy">📋</button>
                                </div>
                                <div class="account-info">
                                    <span>Mật khẩu:</span> <code>${acc.password}</code>
                                    <button onclick="navigator.clipboard.writeText('${acc.password}')" class="btn-copy">📋</button>
                                </div>
                            </div>
                        `;
                    });
                    accountsHTML += '</div>';
                    accountsDisplay.innerHTML = accountsHTML;
                }
            }
            
            // Move to step 3
            currentStep = 3;
            
            // Update steps indicator
            document.querySelectorAll('.step-item').forEach((item, index) => {
                item.classList.remove('active', 'completed');
                if (index + 1 < 3) {
                    item.classList.add('completed');
                } else if (index + 1 === 3) {
                    item.classList.add('active');
                }
            });
            
            // Update step content
            document.querySelectorAll('.checkout-step').forEach((stepEl, index) => {
                stepEl.classList.remove('active');
                if (index + 1 === 3) {
                    stepEl.classList.add('active');
                }
            });
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } else {
            alert(result.message || 'Lỗi khi tạo đơn hàng!');
        }
        
    } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert('Lỗi kết nối! Vui lòng thử lại.');
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


// ============================================
// VOUCHER FUNCTIONS
// ============================================

let appliedVoucherData = null;

async function applyVoucher() {
    const code = document.getElementById('voucherCodeInput').value.trim().toUpperCase();
    const resultEl = document.getElementById('voucherResult');
    
    if (!code) {
        resultEl.style.display = 'block';
        resultEl.className = 'voucher-result error';
        resultEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Vui lòng nhập mã giảm giá';
        return;
    }
    
    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const productIds = cart.map(item => item.id);
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch('/api/vouchers/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'X-CSRF-Token': getCsrfToken()
            },
            body: JSON.stringify({
                code: code,
                orderAmount: total,
                productIds: productIds
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            appliedVoucherData = result.data;
            
            // Show success
            resultEl.style.display = 'block';
            resultEl.className = 'voucher-result success';
            resultEl.innerHTML = `<i class="fas fa-check-circle"></i> ${result.message}`;
            
            // Show applied voucher
            document.getElementById('appliedVoucherCode').textContent = code;
            document.getElementById('appliedVoucherDiscount').textContent = formatPrice(result.data.discountAmount);
            document.getElementById('appliedVoucher').style.display = 'block';
            
            // Update summary and balance check
            updateAllSummaries();
            checkBalance();
            
            // Hide input and clear
            document.getElementById('voucherCodeInput').value = '';
            setTimeout(() => {
                resultEl.style.display = 'none';
            }, 3000);
        } else {
            resultEl.style.display = 'block';
            resultEl.className = 'voucher-result error';
            resultEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${result.message}`;
        }
    } catch (error) {
        console.error('Apply voucher error:', error);
        resultEl.style.display = 'block';
        resultEl.className = 'voucher-result error';
        resultEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Lỗi kết nối!';
    }
}

function removeVoucher() {
    appliedVoucherData = null;
    document.getElementById('appliedVoucher').style.display = 'none';
    document.getElementById('voucherCodeInput').value = '';
    updateAllSummaries();
    checkBalance();
}
