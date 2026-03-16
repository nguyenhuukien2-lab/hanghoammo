// Wallet.js - Quản lý nạp tiền

// Load wallet info
async function loadWalletInfo() {
    try {
        const data = await apiRequest('/wallet');
        const balance = data.data.balance || 0;
        
        document.getElementById('walletBalance').textContent = 
            balance.toLocaleString('vi-VN') + 'đ';
    } catch (error) {
        console.error('Failed to load wallet info:', error);
        showNotification('Không thể tải thông tin ví', 'error');
    }
}

// Load transaction history
async function loadTransactions() {
    try {
        const data = await apiRequest('/wallet/transactions');
        const transactions = data.data || [];
        
        const listEl = document.getElementById('transactionList');
        if (transactions.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>Chưa có giao dịch nào</p>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = transactions.map(tx => {
            const isDeposit = tx.type === 'deposit';
            return `
                <div class="transaction-item">
                    <div>
                        <div class="tx-type">
                            ${isDeposit ? '💰 Nạp tiền' : '🛒 Mua hàng'}
                        </div>
                        <div class="tx-date">${new Date(tx.created_at).toLocaleString('vi-VN')}</div>
                        ${tx.description ? `<div style="color: #999; font-size: 13px; margin-top: 3px;">${tx.description}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div class="tx-amount ${isDeposit ? 'positive' : 'negative'}">
                            ${isDeposit ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}đ
                        </div>
                        <div style="color: #999; font-size: 13px; margin-top: 3px;">
                            Số dư: ${tx.balance_after.toLocaleString('vi-VN')}đ
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

// Load deposit requests
async function loadDepositRequests() {
    try {
        const data = await apiRequest('/wallet/deposits');
        const deposits = data.data || [];
        
        const listEl = document.getElementById('depositRequestList');
        if (deposits.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Chưa có yêu cầu nạp tiền nào</p>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = deposits.map(dep => {
            const statusText = {
                'pending': 'Chờ duyệt',
                'approved': 'Đã duyệt',
                'rejected': 'Từ chối'
            };
            
            const paymentMethodText = {
                'zalopay': '💙 ZaloPay',
                'momo': '📱 MoMo',
                'vnpay': '🔴 VNPay',
                'vietinbank': '🏦 VietinBank',
                'mbbank': '🏦 MBBank'
            };
            
            return `
                <div class="deposit-item">
                    <div>
                        <div style="font-weight: 600; font-size: 18px; color: #333;">
                            ${dep.amount.toLocaleString('vi-VN')}đ
                        </div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">
                            ${paymentMethodText[dep.payment_method] || dep.payment_method}
                        </div>
                        ${dep.note ? `<div style="color: #999; font-size: 13px; margin-top: 3px;">Nội dung: ${dep.note}</div>` : ''}
                        <div class="dep-date">${new Date(dep.created_at).toLocaleString('vi-VN')}</div>
                    </div>
                    <div>
                        <span class="deposit-status status-${dep.status}">
                            ${statusText[dep.status] || dep.status}
                        </span>
                        ${dep.status === 'rejected' && dep.reject_reason ? `
                            <div style="color: #ff4757; font-size: 13px; margin-top: 5px;">
                                Lý do: ${dep.reject_reason}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load deposit requests:', error);
    }
}

// Bank account information
const bankAccounts = {
    zalopay: {
        title: '💙 Thông tin ZaloPay',
        accountNumber: '0879062222',
        bankName: 'ZaloPay (Liên kết MBBank)',
        accountHolder: 'NGUYEN HUU KIEN',
        bin: '970422',
        template: 'compact'
    },
    momo: {
        title: '📱 Thông tin ví MoMo',
        accountNumber: '0879062222',
        bankName: 'Ví MoMo',
        accountHolder: 'NGUYEN HUU KIEN',
        bin: '9704',
        template: 'compact'
    },
    vnpay: {
        title: '🔴 Thông tin VNPay QR',
        accountNumber: '101884511335',
        bankName: 'VietinBank (VNPay QR)',
        accountHolder: 'NGUYEN HUU KIEN',
        bin: '970415',
        template: 'compact'
    },
    vietinbank: {
        title: '🏦 Thông tin VietinBank',
        accountNumber: '101884511335',
        bankName: 'VietinBank CN BAC DA NANG - HOI SO',
        accountHolder: 'NGUYEN HUU KIEN',
        bin: '970415',
        template: 'compact'
    },
    mbbank: {
        title: '🏦 Thông tin MBBank',
        accountNumber: '0879062222',
        bankName: 'MBBank',
        accountHolder: 'NGUYEN HUU KIEN',
        bin: '970422',
        template: 'compact'
    }
};

// Generate QR Code using VietQR API
function generateQRCode(bankInfo, amount, content) {
    // VietQR API: https://api.vietqr.io/v2/generate
    const qrData = {
        accountNo: bankInfo.accountNumber,
        accountName: bankInfo.accountHolder,
        acqId: bankInfo.bin,
        amount: amount || 0,
        addInfo: content || 'Nap tien HangHoaMMO',
        format: 'text',
        template: bankInfo.template
    };
    
    // Create QR URL
    const qrUrl = `https://img.vietqr.io/image/${qrData.acqId}-${qrData.accountNo}-${qrData.template}.png?amount=${qrData.amount}&addInfo=${encodeURIComponent(qrData.addInfo)}&accountName=${encodeURIComponent(qrData.accountName)}`;
    
    return qrUrl;
}

// Update payment info based on selected method
function updatePaymentInfo() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentInfoDiv = document.getElementById('paymentInfo');
    const amount = parseInt(document.getElementById('depositAmount').value) || 0;
    
    if (!paymentMethod) {
        paymentInfoDiv.style.display = 'none';
        return;
    }
    
    const bankInfo = bankAccounts[paymentMethod];
    if (bankInfo) {
        // Generate transfer content with user email
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userEmail = currentUser ? currentUser.email : 'user';
        const transferContent = `NAPTHE ${userEmail.split('@')[0]}`;
        
        // Update text info
        document.getElementById('paymentTitle').textContent = bankInfo.title;
        document.getElementById('accountNumber').textContent = bankInfo.accountNumber;
        document.getElementById('bankName').textContent = bankInfo.bankName;
        document.getElementById('accountHolder').textContent = bankInfo.accountHolder;
        document.getElementById('transferContent').textContent = transferContent;
        
        // Auto-fill note field
        document.getElementById('depositNote').value = transferContent;
        
        // Generate and display QR code
        const qrUrl = generateQRCode(bankInfo, amount, transferContent);
        const qrImage = document.getElementById('qrCodeImage');
        qrImage.src = qrUrl;
        qrImage.style.display = 'block';
        
        paymentInfoDiv.style.display = 'block';
    }
}

// Update QR when amount changes
document.getElementById('depositAmount').addEventListener('input', function() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (paymentMethod) {
        updatePaymentInfo();
    }
});

// Open/close deposit modal
function openDepositModal() {
    document.getElementById('depositModal').classList.add('active');
}

function closeDepositModal() {
    document.getElementById('depositModal').classList.remove('active');
    // Reset form and hide payment info
    document.getElementById('depositForm').reset();
    document.getElementById('paymentInfo').style.display = 'none';
}

// Submit deposit request
const depositForm = document.getElementById('depositForm');
if (depositForm) {
    depositForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const amount = parseInt(formData.get('amount'));
        const payment_method = formData.get('payment_method');
        const note = formData.get('note');
        
        // Validate amount
        if (amount < 10000) {
            showNotification('Số tiền nạp tối thiểu là 10.000đ', 'error');
            return;
        }
        
        // Validate note
        if (!note || note.trim() === '') {
            showNotification('Vui lòng nhập nội dung chuyển khoản hoặc mã giao dịch', 'error');
            return;
        }
        
        const btnSubmit = this.querySelector('.btn-submit-deposit');
        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        btnSubmit.disabled = true;
        
        try {
            await apiRequest('/wallet/deposit', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    payment_method,
                    transaction_code: note.substring(0, 50), // Use first 50 chars of note as transaction code
                    note
                })
            });
            
            showNotification('Gửi yêu cầu nạp tiền thành công! Vui lòng chờ admin duyệt.');
            closeDepositModal();
            this.reset();
            
            // Reload deposit requests
            loadDepositRequests();
        } catch (error) {
            showNotification(error.message || 'Gửi yêu cầu thất bại', 'error');
        } finally {
            btnSubmit.innerHTML = originalHTML;
            btnSubmit.disabled = false;
        }
    });
}

// Check if user is logged in
function checkWalletAuth() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!authToken || !currentUser) {
        showNotification('Vui lòng đăng nhập để nạp tiền!', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return false;
    }
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check auth first
    if (!checkWalletAuth()) {
        return;
    }
    
    // Load all data
    loadWalletInfo();
    loadTransactions();
    loadDepositRequests();
    
    // Auto refresh every 30 seconds
    setInterval(() => {
        loadWalletInfo();
        loadTransactions();
        loadDepositRequests();
    }, 30000);
});
