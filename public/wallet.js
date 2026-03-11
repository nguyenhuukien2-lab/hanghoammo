// Wallet.js - Quản lý ví tiền

let selectedBank = null;
let selectedAmount = 0;

// Bank account information
const bankAccounts = {
    mbbank: {
        name: 'MB Bank',
        accountNumber: '6808688668',
        accountHolder: 'DINH GIA TOAN',
        bin: '970422'
    },
    bidv: {
        name: 'BIDV',
        accountNumber: '12345678901',
        accountHolder: 'NGUYEN VAN A',
        bin: '970418'
    },
    kienlongbank: {
        name: 'Kien Long Bank',
        accountNumber: '98765432101',
        accountHolder: 'TRAN THI B',
        bin: '970452'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeWallet();
});

function initializeWallet() {
    // Bank selection
    const bankOptions = document.querySelectorAll('.bank-option');
    bankOptions.forEach(option => {
        option.addEventListener('click', function() {
            bankOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedBank = this.dataset.bank;
        });
    });

    // Quick amount buttons
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            document.getElementById('depositAmount').value = amount;
            selectedAmount = amount;
        });
    });

    // Amount input
    document.getElementById('depositAmount').addEventListener('input', function() {
        selectedAmount = parseInt(this.value) || 0;
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generatePaymentCode);

    // Payment tabs
    const paymentTabs = document.querySelectorAll('.payment-tab');
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            paymentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            if (this.dataset.tab === 'usdt') {
                showNotification('Tính năng USDT đang được phát triển', 'info');
            }
        });
    });
}

// Generate payment code
function generatePaymentCode() {
    // Validate
    if (!selectedBank) {
        showNotification('Vui lòng chọn ngân hàng', 'error');
        return;
    }

    if (!selectedAmount || selectedAmount < 10000) {
        showNotification('Số tiền tối thiểu là 10.000đ', 'error');
        return;
    }

    // Get bank info
    const bankInfo = bankAccounts[selectedBank];
    
    // Generate transfer content
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userEmail = currentUser ? currentUser.email : 'user';
    const transferContent = `CSH22D2C736 NAP${userEmail.split('@')[0].substring(0, 8).toUpperCase()}`;
    
    // Generate QR code
    const qrUrl = generateQRCode(bankInfo, selectedAmount, transferContent);
    
    // Update UI
    document.getElementById('qrCodeImage').src = qrUrl;
    document.getElementById('displayAmount').textContent = selectedAmount.toLocaleString('vi-VN');
    document.getElementById('transferContent').textContent = transferContent;
    document.getElementById('bankName').textContent = bankInfo.name;
    document.getElementById('accountNumber').textContent = bankInfo.accountNumber;
    document.getElementById('accountHolder').textContent = bankInfo.accountHolder;
    
    // Show payment info section
    document.getElementById('paymentInfoSection').classList.add('active');
    
    // Scroll to payment info
    document.getElementById('paymentInfoSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Start checking payment status
    startPaymentCheck(transferContent, selectedAmount);
}

// Generate QR Code using VietQR API
function generateQRCode(bankInfo, amount, content) {
    const qrUrl = `https://img.vietqr.io/image/${bankInfo.bin}-${bankInfo.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(bankInfo.accountHolder)}`;
    return qrUrl;
}

// Copy functions
function copyAmount() {
    const amount = selectedAmount;
    navigator.clipboard.writeText(amount).then(() => {
        showNotification('Đã copy số tiền', 'success');
    });
}

function copyContent() {
    const content = document.getElementById('transferContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        showNotification('Đã copy nội dung chuyển khoản', 'success');
    });
}

function copyAccountNumber() {
    const accountNumber = document.getElementById('accountNumber').textContent;
    navigator.clipboard.writeText(accountNumber).then(() => {
        showNotification('Đã copy số tài khoản', 'success');
    });
}

// Check payment status
let paymentCheckInterval = null;

function startPaymentCheck(transferContent, amount) {
    // Clear existing interval
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
    }
    
    // Check every 5 seconds
    paymentCheckInterval = setInterval(async () => {
        try {
            const response = await apiRequest('/wallet/check-payment', {
                method: 'POST',
                body: JSON.stringify({
                    transfer_content: transferContent,
                    amount: amount
                })
            });
            
            if (response.data && response.data.paid) {
                clearInterval(paymentCheckInterval);
                showNotification('Thanh toán thành công! Số dư đã được cập nhật.', 'success');
                setTimeout(() => {
                    window.location.href = 'profile.html#wallet';
                }, 2000);
            }
        } catch (error) {
            console.error('Payment check error:', error);
        }
    }, 5000);
}

// Manual check payment
async function checkPayment() {
    const transferContent = document.getElementById('transferContent').textContent;
    const amount = selectedAmount;
    
    const btn = event.target;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...';
    btn.disabled = true;
    
    try {
        const response = await apiRequest('/wallet/check-payment', {
            method: 'POST',
            body: JSON.stringify({
                transfer_content: transferContent,
                amount: amount
            })
        });
        
        if (response.data && response.data.paid) {
            showNotification('Thanh toán thành công! Số dư đã được cập nhật.', 'success');
            setTimeout(() => {
                window.location.href = 'profile.html#wallet';
            }, 2000);
        } else {
            showNotification('Chưa nhận được thanh toán. Vui lòng thử lại sau.', 'info');
        }
    } catch (error) {
        showNotification(error.message || 'Kiểm tra thất bại', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// Reset form
function resetForm() {
    // Clear interval
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
    }
    
    // Hide payment info
    document.getElementById('paymentInfoSection').classList.remove('active');
    
    // Reset selections
    document.querySelectorAll('.bank-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('depositAmount').value = '';
    selectedBank = null;
    selectedAmount = 0;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open PayOS page
function openPayOS() {
    const bankInfo = bankAccounts[selectedBank];
    if (!bankInfo) {
        showNotification('Vui lòng chọn ngân hàng', 'error');
        return;
    }
    
    const transferContent = document.getElementById('transferContent').textContent;
    const amount = selectedAmount;
    
    // Generate PayOS URL (example)
    const payosUrl = `https://pay.payos.vn/transfer?bank=${bankInfo.bin}&account=${bankInfo.accountNumber}&amount=${amount}&content=${encodeURIComponent(transferContent)}`;
    
    window.open(payosUrl, '_blank');
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
    }
});
