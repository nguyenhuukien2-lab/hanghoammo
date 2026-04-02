// Payment UI functionality

let selectedPaymentMethod = 'wallet';

function getCsrfToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrfToken='))
        ?.split('=')[1] || '';
}

// Load wallet balance
async function loadWalletBalance() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
        const response = await fetch('/api/wallet', {
            headers: { 'Authorization': `Bearer ${authToken}` },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
            const balance = data.data.balance || 0;
            const balanceEl = document.getElementById('walletBalance');
            if (balanceEl) {
                balanceEl.textContent = balance.toLocaleString('vi-VN') + 'đ';
            }
            return balance;
        }
    } catch (error) {
        console.error('Load wallet balance error:', error);
    }
    return 0;
}

// Handle payment method selection
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`input[value="${method}"]`)?.closest('.payment-method-item');
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}

// Process payment
async function processPayment(orderId, amount) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Vui lòng đăng nhập!', 'error');
        return;
    }

    const csrfToken = getCsrfToken();

    try {
        if (selectedPaymentMethod === 'wallet') {
            // Pay with wallet - already handled in order creation
            return { success: true };
        } else if (selectedPaymentMethod === 'vnpay') {
            // Create VNPay payment
            const response = await fetch('/api/payment/vnpay/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({
                    orderId,
                    amount,
                    orderInfo: `Thanh toan don hang ${orderId}`
                })
            });

            const data = await response.json();
            if (data.success) {
                // Redirect to VNPay
                window.location.href = data.paymentUrl;
                return { success: true, redirect: true };
            } else {
                throw new Error(data.message);
            }
        } else if (selectedPaymentMethod === 'momo') {
            // Create Momo payment
            const response = await fetch('/api/payment/momo/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({
                    orderId,
                    amount,
                    orderInfo: `Thanh toan don hang ${orderId}`
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // Redirect to Momo
                window.location.href = data.paymentUrl;
                return { success: true, redirect: true };
            } else {
                throw new Error(data.message);
            }
        } else if (selectedPaymentMethod === 'zalopay') {
            const response = await fetch('/api/payment/zalopay/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ orderId, amount, orderInfo: `Thanh toan don hang ${orderId}` })
            });
            const data = await response.json();
            if (data.success) {
                window.location.href = data.paymentUrl;
                return { success: true, redirect: true };
            } else {
                throw new Error(data.message);
            }
        }
    } catch (error) {
        console.error('Process payment error:', error);
        showNotification(error.message || 'Có lỗi xảy ra khi thanh toán', 'error');
        return { success: false };
    }
}

// Check payment status from callback
function checkPaymentCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const orderId = urlParams.get('orderId');
    
    if (payment === 'success') {
        showNotification('Thanh toán thành công!', 'success');
        setTimeout(() => {
            window.location.href = `orders.html?id=${orderId}`;
        }, 2000);
    } else if (payment === 'failed') {
        const code = urlParams.get('code');
        showNotification(`Thanh toán thất bại! Mã lỗi: ${code}`, 'error');
    }
}

// Initialize payment UI
function initPaymentUI() {
    loadWalletBalance();
    checkPaymentCallback();
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        input.addEventListener('change', (e) => selectPaymentMethod(e.target.value));
    });
}

// Render payment methods vào container
function loadPaymentMethods(total = 0, balance = 0) {
    const container = document.getElementById('paymentMethodsContainer');
    if (!container) return;

    const hasEnough = balance >= total;

    container.innerHTML = `
        <div class="payment-methods">
            <h3><i class="fas fa-credit-card"></i> Chọn phương thức thanh toán</h3>

            <div class="payment-method-item ${hasEnough ? 'selected' : ''}" onclick="selectPaymentMethod('wallet')">
                <input type="radio" name="paymentMethod" value="wallet" ${hasEnough ? 'checked' : ''}>
                <label>
                    <div class="payment-icon" style="background:#e8f4fd;color:#0066FF">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="payment-info">
                        <strong>Ví HangHoaMMO</strong>
                        <span>Số dư: <b style="color:${hasEnough?'#28a745':'#dc3545'}">${balance.toLocaleString('vi-VN')}đ</b> ${!hasEnough ? '— Không đủ' : '— Giao hàng tức thì'}</span>
                    </div>
                    <i class="fas fa-check-circle"></i>
                </label>
            </div>

            <div class="payment-method-item" onclick="selectPaymentMethod('zalopay')">
                <input type="radio" name="paymentMethod" value="zalopay">
                <label>
                    <div class="payment-icon" style="background:#e8f9f0;padding:4px">
                        <img src="https://zalopay.vn/images/logo.png" alt="ZaloPay" style="width:42px;height:42px;object-fit:contain" onerror="this.parentElement.innerHTML='<span style=font-size:20px>💙</span>'">
                    </div>
                    <div class="payment-info">
                        <strong>ZaloPay</strong>
                        <span>Thanh toán qua ví ZaloPay / QR / ATM / Visa</span>
                    </div>
                    <i class="fas fa-check-circle"></i>
                </label>
            </div>

            <div class="payment-method-item" onclick="selectPaymentMethod('momo')">
                <input type="radio" name="paymentMethod" value="momo">
                <label>
                    <div class="payment-icon" style="background:#fce8f5;color:#a50064">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div class="payment-info">
                        <strong>Momo</strong>
                        <span>Thanh toán qua ví Momo (sắp ra mắt)</span>
                    </div>
                    <i class="fas fa-check-circle"></i>
                </label>
            </div>

            <div class="payment-method-item" onclick="selectPaymentMethod('vnpay')">
                <input type="radio" name="paymentMethod" value="vnpay">
                <label>
                    <div class="payment-icon" style="background:#fff0f0;color:#e53935">
                        <i class="fas fa-university"></i>
                    </div>
                    <div class="payment-info">
                        <strong>VNPay</strong>
                        <span>Thanh toán qua ngân hàng / QR VNPay (sắp ra mắt)</span>
                    </div>
                    <i class="fas fa-check-circle"></i>
                </label>
            </div>
        </div>
    `;

    // Set default
    selectPaymentMethod(hasEnough ? 'wallet' : 'zalopay');
}

// Add payment method styles
const paymentStyles = `
<style>
.payment-methods {
    margin: 30px 0;
}

.payment-methods h3 {
    font-size: 18px;
    margin-bottom: 20px;
    color: #333;
}

.payment-method-item {
    margin-bottom: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;
}

.payment-method-item:hover {
    border-color: #667eea;
}

.payment-method-item.selected {
    border-color: #667eea;
    background: #f8f9ff;
}

.payment-method-item input {
    display: none;
}

.payment-method-item label {
    display: flex;
    align-items: center;
    padding: 20px;
    cursor: pointer;
    gap: 15px;
}

.payment-icon {
    width: 50px;
    height: 50px;
    background: #f0f0f0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #667eea;
}

.payment-info {
    flex: 1;
}

.payment-info strong {
    display: block;
    font-size: 16px;
    color: #333;
    margin-bottom: 5px;
}

.payment-info span {
    font-size: 14px;
    color: #999;
}

.payment-method-item label > i.fa-check-circle {
    font-size: 24px;
    color: #e0e0e0;
}

.payment-method-item.selected label > i.fa-check-circle {
    color: #667eea;
}
</style>
`;

// Inject styles
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', paymentStyles);
}
