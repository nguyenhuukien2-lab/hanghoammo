// Voucher functionality

let appliedVoucher = null;

// Apply voucher
async function applyVoucher() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Vui lòng đăng nhập!', 'error');
        return;
    }
    
    const code = document.getElementById('voucherCode').value.trim().toUpperCase();
    if (!code) {
        showNotification('Vui lòng nhập mã voucher!', 'error');
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const productIds = cart.map(item => item.id || item._id);
    
    try {
        const response = await fetch('/api/vouchers/validate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code,
                orderAmount,
                productIds
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            appliedVoucher = data.data;
            showNotification(data.message || 'Áp dụng mã giảm giá thành công!');
            updateCheckoutSummary();
            
            // Update UI
            const voucherInput = document.getElementById('voucherCode');
            const applyBtn = document.getElementById('applyVoucherBtn');
            if (voucherInput) voucherInput.disabled = true;
            if (applyBtn) {
                applyBtn.textContent = 'Đã áp dụng';
                applyBtn.disabled = true;
            }
        } else {
            showNotification(data.message || 'Mã voucher không hợp lệ', 'error');
        }
    } catch (error) {
        console.error('Apply voucher error:', error);
        showNotification('Có lỗi xảy ra', 'error');
    }
}

// Remove voucher
function removeVoucher() {
    appliedVoucher = null;
    
    const voucherInput = document.getElementById('voucherCode');
    const applyBtn = document.getElementById('applyVoucherBtn');
    
    if (voucherInput) {
        voucherInput.value = '';
        voucherInput.disabled = false;
    }
    if (applyBtn) {
        applyBtn.textContent = 'Áp dụng';
        applyBtn.disabled = false;
    }
    
    updateCheckoutSummary();
    showNotification('Đã xóa mã giảm giá');
}

// Update checkout summary with voucher
function updateCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discount = 0;
    let finalTotal = subtotal;
    
    if (appliedVoucher) {
        discount = appliedVoucher.discountAmount;
        finalTotal = appliedVoucher.finalAmount;
    }
    
    // Update UI
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const discountEl = document.getElementById('checkoutDiscount');
    const totalEl = document.getElementById('checkoutTotal');
    
    if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + 'đ';
    
    if (discountEl) {
        if (discount > 0) {
            discountEl.parentElement.style.display = 'flex';
            discountEl.textContent = '-' + discount.toLocaleString('vi-VN') + 'đ';
        } else {
            discountEl.parentElement.style.display = 'none';
        }
    }
    
    if (totalEl) totalEl.textContent = finalTotal.toLocaleString('vi-VN') + 'đ';
    
    // Show voucher info
    const voucherInfoEl = document.getElementById('voucherInfo');
    if (voucherInfoEl && appliedVoucher) {
        voucherInfoEl.innerHTML = `
            <div class="voucher-applied">
                <i class="fas fa-check-circle"></i>
                <span>Mã "${appliedVoucher.voucher.code}" đã được áp dụng</span>
                <button onclick="removeVoucher()" class="btn-remove-voucher">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        voucherInfoEl.style.display = 'block';
    } else if (voucherInfoEl) {
        voucherInfoEl.style.display = 'none';
    }
}

// Load available vouchers
async function loadAvailableVouchers() {
    try {
        const response = await fetch('/api/vouchers');
        const data = await response.json();
        
        if (data.success) {
            displayAvailableVouchers(data.data);
        }
    } catch (error) {
        console.error('Load vouchers error:', error);
    }
}

// Display available vouchers
function displayAvailableVouchers(vouchers) {
    const container = document.getElementById('availableVouchers');
    if (!container) return;
    
    if (vouchers.length === 0) {
        container.innerHTML = '<p>Không có voucher khả dụng</p>';
        return;
    }
    
    container.innerHTML = vouchers.map(voucher => {
        const discountText = voucher.type === 'percentage' 
            ? `Giảm ${voucher.value}%` 
            : `Giảm ${voucher.value.toLocaleString('vi-VN')}đ`;
        
        return `
            <div class="voucher-card">
                <div class="voucher-icon">
                    <i class="fas fa-ticket-alt"></i>
                </div>
                <div class="voucher-info">
                    <div class="voucher-code">${voucher.code}</div>
                    <div class="voucher-name">${voucher.name}</div>
                    <div class="voucher-discount">${discountText}</div>
                    ${voucher.min_order_amount > 0 ? `
                        <div class="voucher-condition">
                            Đơn tối thiểu: ${voucher.min_order_amount.toLocaleString('vi-VN')}đ
                        </div>
                    ` : ''}
                    <div class="voucher-expiry">
                        HSD: ${new Date(voucher.end_date).toLocaleDateString('vi-VN')}
                    </div>
                </div>
                <button class="btn-use-voucher" onclick="useVoucherCode('${voucher.code}')">
                    Sử dụng
                </button>
            </div>
        `;
    }).join('');
}

// Use voucher code
function useVoucherCode(code) {
    const voucherInput = document.getElementById('voucherCode');
    if (voucherInput) {
        voucherInput.value = code;
        applyVoucher();
    }
}
