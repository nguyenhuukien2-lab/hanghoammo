# 🚀 HƯỚNG DẪN BẮT ĐẦU NGAY

## ⚡ QUICK START (5 phút)

### 1. Khởi động server
```bash
npm run dev
```

### 2. Mở browser
```
http://localhost:3001
```

### 3. Mở file cần sửa
```
public/script.js
```

---

## 📝 BƯỚC 1: SỬA ĐĂNG KÝ (30 phút)

### Tìm dòng 600 trong script.js:
```javascript
modalRegisterForm.addEventListener('submit', async function(e) {
```

### Tìm đoạn code này (khoảng dòng 650):
```javascript
users.push(newUser);
localStorage.setItem('users', JSON.stringify(users));
```

### Thay thế bằng:
```javascript
// Gọi API thay vì localStorage
const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password })
});

// Lưu token
authToken = data.token;
currentUser = data.user;
localStorage.setItem('authToken', authToken);
localStorage.setItem('currentUser', JSON.stringify(currentUser));
```

### Test:
1. Mở http://localhost:3001
2. Click "Đăng ký"
3. Điền form và submit
4. Mở Supabase → Table "users" → Xem có user mới không

---

## 📝 BƯỚC 2: SỬA ĐĂNG NHẬP (20 phút)

### Tìm dòng 550 trong script.js:
```javascript
modalLoginForm.addEventListener('submit', async function(e) {
```

### Tìm đoạn code này (khoảng dòng 570):
```javascript
const users = JSON.parse(localStorage.getItem('users')) || [];
const user = users.find(u => u.email === email && u.password === password);
```

### Thay thế bằng:
```javascript
// Gọi API
const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
});

// Lưu token
authToken = data.token;
currentUser = data.user;
localStorage.setItem('authToken', authToken);
localStorage.setItem('currentUser', JSON.stringify(currentUser));
```

### Test:
1. Đăng nhập với tài khoản vừa tạo
2. Mở Console → Xem có JWT token không
3. Check localStorage → Xem có authToken không

---

## 📝 BƯỚC 3: HIỂN THỊ SỐ DƯ VÍ (30 phút)

### Thêm vào cuối script.js:
```javascript
// Load wallet balance
async function loadWalletBalance() {
    if (!authToken) return;
    
    try {
        const data = await apiRequest('/wallet');
        const balance = data.data.balance || 0;
        
        // Hiển thị số dư
        const balanceEl = document.getElementById('userBalanceDisplay');
        if (balanceEl) {
            balanceEl.textContent = `💰 ${balance.toLocaleString('vi-VN')}đ`;
        }
    } catch (error) {
        console.error('Failed to load wallet balance:', error);
    }
}
```

### Sửa hàm updateUserUI() (khoảng dòng 950):
```javascript
function updateUserUI() {
    const btnLogin = document.querySelector('.btn-auth.login');
    const btnRegister = document.querySelector('.btn-auth.register');
    
    if (currentUser && btnLogin && btnRegister) {
        btnLogin.innerHTML = `<i class="fas fa-user"></i><span>${currentUser.name}</span>`;
        btnLogin.onclick = null;
        btnRegister.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Đăng xuất</span>`;
        btnRegister.onclick = logout;
        
        // Thêm dòng này
        loadWalletBalance();
    }
}
```

### Thêm vào index.html (trong header):
```html
<div id="userProfileBtn" style="display: none;">
    <div class="user-info">
        <span id="userNameDisplay">User</span>
        <span id="userBalanceDisplay" class="user-balance">💰 0đ</span>
    </div>
</div>
```

### Test:
1. Đăng nhập
2. Xem header có hiển thị số dư không (mặc định 0đ)

---

## 📝 BƯỚC 4: TẠO TRANG NẠP TIỀN (1-2 giờ)

### Tạo file: public/wallet.html
Copy từ index.html, sửa phần content:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Ví tiền - HangHoaMMO</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Copy header từ index.html -->
    
    <div class="wallet-container" style="max-width: 1200px; margin: 100px auto; padding: 20px;">
        <h1>Ví tiền của tôi</h1>
        
        <div class="wallet-balance-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <h2>Số dư hiện tại</h2>
            <div id="walletBalance" style="font-size: 48px; font-weight: bold; margin: 20px 0;">0đ</div>
            <button onclick="openDepositModal()" style="background: white; color: #667eea; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-plus"></i> Nạp tiền
            </button>
        </div>
        
        <div class="transaction-history" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
            <h3>Lịch sử giao dịch</h3>
            <div id="transactionList"></div>
        </div>
        
        <div class="deposit-requests" style="background: white; padding: 20px; border-radius: 15px;">
            <h3>Yêu cầu nạp tiền</h3>
            <div id="depositRequestList"></div>
        </div>
    </div>
    
    <!-- Modal nạp tiền -->
    <div id="depositModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 500px;">
            <h3>Nạp tiền vào ví</h3>
            <form id="depositForm">
                <input type="number" name="amount" placeholder="Số tiền (VNĐ)" required style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px;">
                
                <select name="payment_method" required style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px;">
                    <option value="momo">MoMo</option>
                    <option value="bank">Chuyển khoản ngân hàng</option>
                </select>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 10px 0; text-align: center;">
                    <p><strong>Thông tin chuyển khoản:</strong></p>
                    <p>STK: 1234567890</p>
                    <p>Ngân hàng: ABC Bank</p>
                    <p>Chủ TK: NGUYEN VAN A</p>
                </div>
                
                <input type="text" name="transaction_code" placeholder="Mã giao dịch" required style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px;">
                
                <textarea name="note" placeholder="Ghi chú (tùy chọn)" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; min-height: 80px;"></textarea>
                
                <button type="submit" style="width: 100%; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                    Gửi yêu cầu
                </button>
                
                <button type="button" onclick="closeDepositModal()" style="width: 100%; padding: 15px; background: #ddd; color: #333; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px;">
                    Hủy
                </button>
            </form>
        </div>
    </div>
    
    <script src="script.js"></script>
    <script src="wallet.js"></script>
</body>
</html>
```

### Tạo file: public/wallet.js

```javascript
// Load wallet info
async function loadWalletInfo() {
    try {
        const data = await apiRequest('/wallet');
        const balance = data.data.balance || 0;
        
        document.getElementById('walletBalance').textContent = 
            balance.toLocaleString('vi-VN') + 'đ';
    } catch (error) {
        showNotification('Không thể tải thông tin ví', 'error');
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const data = await apiRequest('/wallet/transactions');
        const transactions = data.data || [];
        
        const listEl = document.getElementById('transactionList');
        if (transactions.length === 0) {
            listEl.innerHTML = '<p>Chưa có giao dịch nào</p>';
            return;
        }
        
        listEl.innerHTML = transactions.map(tx => `
            <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <div>
                    <strong>${tx.type === 'deposit' ? '💰 Nạp tiền' : '🛒 Mua hàng'}</strong>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">${new Date(tx.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div style="text-align: right;">
                    <strong style="color: ${tx.type === 'deposit' ? '#26de81' : '#ff4757'}; font-size: 18px;">
                        ${tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}đ
                    </strong>
                </div>
            </div>
        `).join('');
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
            listEl.innerHTML = '<p>Chưa có yêu cầu nạp tiền nào</p>';
            return;
        }
        
        listEl.innerHTML = deposits.map(dep => {
            const statusColors = {
                'pending': '#ffa502',
                'approved': '#26de81',
                'rejected': '#ff4757'
            };
            const statusTexts = {
                'pending': 'Chờ duyệt',
                'approved': 'Đã duyệt',
                'rejected': 'Từ chối'
            };
            
            return `
                <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${dep.amount.toLocaleString('vi-VN')}đ</strong>
                        <p style="color: #666; font-size: 14px; margin: 5px 0;">
                            ${dep.payment_method} - Mã GD: ${dep.transaction_code}
                        </p>
                        <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                            ${new Date(dep.created_at).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    <div>
                        <span style="background: ${statusColors[dep.status]}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                            ${statusTexts[dep.status]}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load deposit requests:', error);
    }
}

// Open/close deposit modal
function openDepositModal() {
    document.getElementById('depositModal').style.display = 'flex';
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
}

// Submit deposit request
document.getElementById('depositForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const amount = parseInt(formData.get('amount'));
    const payment_method = formData.get('payment_method');
    const transaction_code = formData.get('transaction_code');
    const note = formData.get('note');
    
    try {
        await apiRequest('/wallet/deposit', {
            method: 'POST',
            body: JSON.stringify({
                amount,
                payment_method,
                transaction_code,
                note
            })
        });
        
        showNotification('Gửi yêu cầu nạp tiền thành công! Vui lòng chờ admin duyệt.');
        closeDepositModal();
        this.reset();
        loadDepositRequests();
    } catch (error) {
        showNotification(error.message || 'Gửi yêu cầu thất bại', 'error');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadWalletInfo();
    loadTransactions();
    loadDepositRequests();
});
```

### Test:
1. Mở http://localhost:3001/wallet.html
2. Xem số dư ví
3. Click "Nạp tiền"
4. Điền form và gửi
5. Kiểm tra Supabase → Table "deposit_requests"

---

## ✅ CHECKLIST NHANH

- [ ] Server đang chạy (npm run dev)
- [ ] Đăng ký gọi API thành công
- [ ] Đăng nhập gọi API thành công
- [ ] Hiển thị số dư ví trên header
- [ ] Trang wallet.html hoạt động
- [ ] Gửi yêu cầu nạp tiền thành công
- [ ] Data lưu vào Supabase

---

## 🐛 LỖI THƯỜNG GẶP

### Lỗi: "Failed to fetch"
→ Kiểm tra server có chạy không (npm run dev)

### Lỗi: "Unauthorized"
→ Kiểm tra authToken có được gửi không

### Lỗi: "Email đã tồn tại"
→ Dùng email khác hoặc xóa user trong Supabase

### Lỗi: Console hiển thị CORS
→ Kiểm tra server có `app.use(cors())` không

---

## 📞 CẦN TRỢ GIÚP?

Nếu gặp lỗi, hãy:
1. Mở Console (F12)
2. Xem lỗi gì
3. Copy lỗi và hỏi tôi

**Chúc bạn thành công! 🚀**
