# 📋 TỔNG KẾT & KẾ HOẠCH TIẾP THEO

## 📊 TÌNH TRẠNG HIỆN TẠI

### ✅ ĐÃ HOÀN THÀNH:

**Backend (Supabase + API):**
- ✅ Supabase PostgreSQL đã setup: https://wjqahsmislryiuqfmyux.supabase.co
- ✅ 8 bảng database: users, wallet, products, accounts, orders, order_items, transactions, deposit_requests
- ✅ Backend API hoàn chỉnh:
  - Auth API: `/api/auth/register`, `/api/auth/login`, `/api/auth/change-password`
  - Products API: CRUD operations
  - Wallet API: `/api/wallet`, `/api/wallet/transactions`, `/api/wallet/deposit`
- ✅ JWT Authentication middleware
- ✅ Server chạy thành công trên port 3001
- ✅ Database có 3 users + 5 sản phẩm mẫu
- ✅ Trigger tự động tạo wallet khi đăng ký

**Frontend:**
- ✅ Giao diện hoàn chỉnh: trang chủ, sản phẩm, chi tiết, checkout, admin
- ✅ Đăng ký/đăng nhập UI với password strength checker
- ✅ Quên mật khẩu 3 bước (email → phone → new password)
- ✅ Giỏ hàng, thanh toán
- ✅ Maintenance banner real-time
- ✅ Admin panel quản lý khách hàng

### ⚠️ VẤN ĐỀ CHÍNH:

**Frontend CHƯA kết nối với Backend API:**
- ❌ Đăng ký/đăng nhập vẫn dùng localStorage
- ❌ Chưa lưu JWT token từ API
- ❌ Chưa hiển thị số dư ví
- ❌ Chưa có trang nạp tiền
- ❌ Admin chưa có chức năng duyệt nạp tiền
- ❌ Code mới CHƯA push lên GitHub/Render

---

## 🎯 NHIỆM VỤ TIẾP THEO (ƯU TIÊN CAO):

### BƯỚC 1: TÍCH HỢP ĐĂNG KÝ/ĐĂNG NHẬP VỚI API ⭐⭐⭐

**Vị trí code:** `public/script.js` dòng 600-750

**Hiện tại:**
```javascript
// Dòng 600-650: modalRegisterForm.addEventListener('submit')
// Đang lưu vào localStorage
users.push(newUser);
localStorage.setItem('users', JSON.stringify(users));
```

**Cần sửa thành:**
```javascript
// Gọi API thay vì localStorage
const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password })
});

// Lưu token và user info
authToken = data.token;
currentUser = data.user;
localStorage.setItem('authToken', authToken);
localStorage.setItem('currentUser', JSON.stringify(currentUser));
```

**Tương tự cho Login (dòng 550-600):**
```javascript
const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
});

authToken = data.token;
currentUser = data.user;
localStorage.setItem('authToken', authToken);
localStorage.setItem('currentUser', JSON.stringify(currentUser));
```

**Quên mật khẩu (dòng 816-950):**
```javascript
// Step 3: Gọi API thay vì update localStorage
const data = await apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
        email: forgotCurrentUser.email,
        phone: document.getElementById('verifyPhone').value,
        newPassword: newPassword
    })
});
```

**Kết quả:** User data lưu vào Supabase, có JWT token để xác thực

---

### BƯỚC 2: HIỂN THỊ SỐ DƯ VÍ TRÊN HEADER ⭐⭐

**Tạo file mới:** `public/wallet.js` (hoặc thêm vào `script.js`)

**Thêm vào header (tất cả file HTML):**
```html
<!-- Trong phần user profile button -->
<div id="userProfileBtn" style="display: none;">
    <div class="user-avatar">
        <span id="userAvatarInitial">U</span>
    </div>
    <div class="user-info">
        <span id="userNameDisplay">User</span>
        <span id="userBalanceDisplay" class="user-balance">💰 0đ</span>
    </div>
</div>
```

**JavaScript để load số dư:**
```javascript
async function loadWalletBalance() {
    if (!authToken) return;
    
    try {
        const data = await apiRequest('/wallet');
        const balance = data.data.balance || 0;
        
        const balanceEl = document.getElementById('userBalanceDisplay');
        if (balanceEl) {
            balanceEl.textContent = `💰 ${balance.toLocaleString('vi-VN')}đ`;
        }
    } catch (error) {
        console.error('Failed to load wallet balance:', error);
    }
}

// Gọi sau khi login thành công
function updateUserUI() {
    checkLoginStatus();
    loadWalletBalance(); // Thêm dòng này
}
```

**Kết quả:** User thấy số dư ví ngay trên header

---

### BƯỚC 3: TẠO TRANG NẠP TIỀN ⭐⭐⭐

**Tạo file mới:** `public/wallet.html`

**Cấu trúc trang:**
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Ví tiền - HangHoaMMO</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Header giống các trang khác -->
    
    <div class="wallet-container">
        <!-- Số dư hiện tại -->
        <div class="wallet-balance-card">
            <h2>Số dư ví</h2>
            <div class="balance-amount" id="walletBalance">0đ</div>
            <button class="btn-deposit" onclick="openDepositModal()">
                <i class="fas fa-plus"></i> Nạp tiền
            </button>
        </div>
        
        <!-- Lịch sử giao dịch -->
        <div class="transaction-history">
            <h3>Lịch sử giao dịch</h3>
            <div id="transactionList"></div>
        </div>
        
        <!-- Yêu cầu nạp tiền -->
        <div class="deposit-requests">
            <h3>Yêu cầu nạp tiền</h3>
            <div id="depositRequestList"></div>
        </div>
    </div>
    
    <!-- Modal nạp tiền -->
    <div id="depositModal" class="modal">
        <div class="modal-content">
            <h3>Nạp tiền vào ví</h3>
            <form id="depositForm">
                <input type="number" placeholder="Số tiền (VNĐ)" required>
                <select name="payment_method" required>
                    <option value="momo">MoMo</option>
                    <option value="bank">Chuyển khoản ngân hàng</option>
                </select>
                
                <!-- Hiển thị QR/STK -->
                <div class="payment-info">
                    <img src="qr-code.png" alt="QR Code">
                    <p>STK: 1234567890 - Ngân hàng ABC</p>
                </div>
                
                <input type="text" placeholder="Mã giao dịch" required>
                <textarea placeholder="Ghi chú (tùy chọn)"></textarea>
                
                <button type="submit" class="btn-submit">Gửi yêu cầu</button>
            </form>
        </div>
    </div>
    
    <script src="script.js"></script>
    <script src="wallet.js"></script>
</body>
</html>
```

**Tạo file:** `public/wallet.js`

```javascript
// Load wallet balance
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

// Load transaction history
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
            <div class="transaction-item">
                <div class="tx-type ${tx.type}">${tx.type === 'deposit' ? 'Nạp tiền' : 'Mua hàng'}</div>
                <div class="tx-amount">${tx.amount.toLocaleString('vi-VN')}đ</div>
                <div class="tx-date">${new Date(tx.created_at).toLocaleString('vi-VN')}</div>
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
        
        listEl.innerHTML = deposits.map(dep => `
            <div class="deposit-item">
                <div class="dep-amount">${dep.amount.toLocaleString('vi-VN')}đ</div>
                <div class="dep-method">${dep.payment_method}</div>
                <div class="dep-status status-${dep.status}">${getStatusText(dep.status)}</div>
                <div class="dep-date">${new Date(dep.created_at).toLocaleString('vi-VN')}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load deposit requests:', error);
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    };
    return statusMap[status] || status;
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

**Kết quả:** User có thể nạp tiền, xem lịch sử giao dịch

---

### BƯỚC 4: ADMIN DUYỆT NẠP TIỀN ⭐⭐⭐

**File cần sửa:** `public/admin.html`, `public/admin.js`

**Thêm tab mới trong admin.html:**
```html
<div class="admin-tabs">
    <button class="tab-btn active" onclick="switchAdminTab('dashboard')">Dashboard</button>
    <button class="tab-btn" onclick="switchAdminTab('products')">Sản phẩm</button>
    <button class="tab-btn" onclick="switchAdminTab('orders')">Đơn hàng</button>
    <button class="tab-btn" onclick="switchAdminTab('customers')">Khách hàng</button>
    <button class="tab-btn" onclick="switchAdminTab('deposits')">Nạp tiền</button> <!-- MỚI -->
    <button class="tab-btn" onclick="switchAdminTab('settings')">Cài đặt</button>
</div>

<!-- Tab nạp tiền -->
<div id="depositsTab" class="admin-tab-content">
    <div class="tab-header">
        <h2>Quản lý nạp tiền</h2>
        <button class="btn-refresh" onclick="loadDepositRequests()">
            <i class="fas fa-sync"></i> Làm mới
        </button>
    </div>
    
    <div class="deposits-list" id="depositsList"></div>
</div>
```

**Thêm vào admin.js:**
```javascript
// Load deposit requests (admin)
async function loadDepositRequests() {
    try {
        // Cần tạo API endpoint mới cho admin
        const data = await apiRequest('/admin/deposits');
        const deposits = data.data || [];
        
        const listEl = document.getElementById('depositsList');
        if (deposits.length === 0) {
            listEl.innerHTML = '<p>Không có yêu cầu nạp tiền nào</p>';
            return;
        }
        
        listEl.innerHTML = deposits.map(dep => `
            <div class="deposit-card">
                <div class="deposit-info">
                    <div class="user-info">
                        <strong>${dep.user_name}</strong>
                        <span>${dep.user_email}</span>
                    </div>
                    <div class="deposit-details">
                        <div class="amount">${dep.amount.toLocaleString('vi-VN')}đ</div>
                        <div class="method">${dep.payment_method}</div>
                        <div class="tx-code">Mã GD: ${dep.transaction_code}</div>
                        ${dep.note ? `<div class="note">${dep.note}</div>` : ''}
                    </div>
                    <div class="deposit-date">
                        ${new Date(dep.created_at).toLocaleString('vi-VN')}
                    </div>
                </div>
                
                ${dep.status === 'pending' ? `
                    <div class="deposit-actions">
                        <button class="btn-approve" onclick="approveDeposit(${dep.id}, ${dep.user_id}, ${dep.amount})">
                            <i class="fas fa-check"></i> Duyệt
                        </button>
                        <button class="btn-reject" onclick="rejectDeposit(${dep.id})">
                            <i class="fas fa-times"></i> Từ chối
                        </button>
                    </div>
                ` : `
                    <div class="deposit-status status-${dep.status}">
                        ${getStatusText(dep.status)}
                    </div>
                `}
            </div>
        `).join('');
    } catch (error) {
        showNotification('Không thể tải danh sách nạp tiền', 'error');
    }
}

// Approve deposit
async function approveDeposit(depositId, userId, amount) {
    if (!confirm(`Xác nhận duyệt nạp ${amount.toLocaleString('vi-VN')}đ?`)) {
        return;
    }
    
    try {
        await apiRequest('/admin/approve-deposit', {
            method: 'POST',
            body: JSON.stringify({
                deposit_id: depositId,
                user_id: userId,
                amount: amount
            })
        });
        
        showNotification('Đã duyệt nạp tiền thành công!');
        loadDepositRequests();
    } catch (error) {
        showNotification(error.message || 'Duyệt nạp tiền thất bại', 'error');
    }
}

// Reject deposit
async function rejectDeposit(depositId) {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    
    try {
        await apiRequest('/admin/reject-deposit', {
            method: 'POST',
            body: JSON.stringify({
                deposit_id: depositId,
                reason: reason
            })
        });
        
        showNotification('Đã từ chối yêu cầu nạp tiền');
        loadDepositRequests();
    } catch (error) {
        showNotification(error.message || 'Từ chối thất bại', 'error');
    }
}
```

**Cần tạo API endpoint mới trong backend:**

**File:** `routes/admin.js` (TẠO MỚI)
```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all deposit requests (admin only)
router.get('/deposits', authenticateToken, isAdmin, async (req, res) => {
    try {
        const supabase = require('../config/supabase');
        const { data, error } = await supabase
            .from('deposit_requests')
            .select(`
                *,
                users (name, email)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Format data
        const formatted = data.map(d => ({
            ...d,
            user_name: d.users.name,
            user_email: d.users.email
        }));
        
        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách nạp tiền'
        });
    }
});

// Approve deposit
router.post('/approve-deposit', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { deposit_id, user_id, amount } = req.body;
        
        // 1. Update deposit status
        await db.updateDepositRequest(deposit_id, {
            status: 'approved',
            approved_at: new Date(),
            approved_by: req.user.id
        });
        
        // 2. Get current wallet balance
        const wallet = await db.getWallet(user_id);
        const newBalance = wallet.balance + amount;
        
        // 3. Update wallet balance
        await db.updateWalletBalance(user_id, newBalance);
        
        // 4. Create transaction record
        await db.createTransaction({
            user_id: user_id,
            type: 'deposit',
            amount: amount,
            description: `Nạp tiền - Mã yêu cầu #${deposit_id}`,
            balance_after: newBalance
        });
        
        res.json({
            success: true,
            message: 'Duyệt nạp tiền thành công'
        });
    } catch (error) {
        console.error('Approve deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt nạp tiền'
        });
    }
});

// Reject deposit
router.post('/reject-deposit', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { deposit_id, reason } = req.body;
        
        await db.updateDepositRequest(deposit_id, {
            status: 'rejected',
            rejected_at: new Date(),
            rejected_by: req.user.id,
            reject_reason: reason
        });
        
        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu nạp tiền'
        });
    } catch (error) {
        console.error('Reject deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối nạp tiền'
        });
    }
});

module.exports = router;
```

**Thêm vào middleware/auth.js:**
```javascript
// Check if user is admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền truy cập'
        });
    }
    next();
}

module.exports = { authenticateToken, isAdmin };
```

**Thêm route vào server-supabase.js:**
```javascript
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
```

**Kết quả:** Admin có thể duyệt/từ chối nạp tiền, tiền tự động cộng vào ví user

---

### BƯỚC 5: PUSH CODE LÊN GITHUB & RENDER ⭐⭐⭐

**Hiện tại:** Code mới chỉ có trên máy local, chưa deploy

**Cần làm:**

1. **Commit code lên GitHub:**
```bash
git add .
git commit -m "feat: integrate Supabase backend API + wallet system"
git push origin main
```

2. **Cập nhật biến môi trường trên Render:**
- Vào Render Dashboard: https://dashboard.render.com
- Chọn service: hanghoammo
- Vào Environment → Add environment variables:
  ```
  SUPABASE_URL=https://wjqahsmislryiuqfmyux.supabase.co
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  JWT_SECRET=hanghoammo_secret_key_2025_very_secure_random_string_change_in_production
  JWT_EXPIRE=7d
  NODE_ENV=production
  ```

3. **Kiểm tra package.json:**
```json
{
  "scripts": {
    "start": "node server-supabase.js",
    "dev": "nodemon server-supabase.js"
  }
}
```

4. **Deploy:**
- Render sẽ tự động deploy khi push code lên GitHub
- Hoặc click "Manual Deploy" trên Render Dashboard

5. **Test production:**
- Truy cập: https://hanghoammo.onrender.com
- Test đăng ký/đăng nhập
- Test nạp tiền
- Kiểm tra data trong Supabase

**Kết quả:** Website production chạy với Supabase backend

---

## ⏰ THỜI GIAN DỰ KIẾN:

| Bước | Nhiệm vụ | Thời gian | Độ khó |
|------|----------|-----------|--------|
| 1 | Tích hợp đăng ký/đăng nhập API | 1-2 giờ | ⭐⭐ |
| 2 | Hiển thị số dư ví | 30 phút | ⭐ |
| 3 | Tạo trang nạp tiền | 2-3 giờ | ⭐⭐⭐ |
| 4 | Admin duyệt nạp tiền | 1-2 giờ | ⭐⭐⭐ |
| 5 | Push code & deploy | 30 phút | ⭐ |

**TỔNG:** 5-8 giờ

---

## 📝 CHECKLIST THỰC HIỆN:

### Sáng (3-4 giờ):
- [ ] Sửa đăng ký/đăng nhập gọi API thay vì localStorage
- [ ] Test đăng ký → Kiểm tra data trong Supabase
- [ ] Test đăng nhập → Nhận JWT token
- [ ] Hiển thị số dư ví trên header
- [ ] Test quên mật khẩu với API

### Chiều (3-4 giờ):
- [ ] Tạo trang wallet.html + wallet.js
- [ ] Form nạp tiền với QR code/STK
- [ ] Gửi yêu cầu nạp tiền qua API
- [ ] Tạo tab "Nạp tiền" trong admin
- [ ] Tạo API endpoint `/api/admin/deposits`
- [ ] Tạo API endpoint `/api/admin/approve-deposit`
- [ ] Test flow: User nạp → Admin duyệt → Tiền vào ví

### Tối (1 giờ):
- [ ] Commit code lên GitHub
- [ ] Cập nhật env variables trên Render
- [ ] Deploy lên production
- [ ] Test toàn bộ trên production
- [ ] Kiểm tra Supabase có nhận data không

---

## 🎯 KẾT QUẢ MONG ĐỢI SAU KHI HOÀN THÀNH:

1. ✅ Đăng ký/đăng nhập lưu vào Supabase (không còn localStorage)
2. ✅ User thấy số dư ví trên header
3. ✅ User có thể nạp tiền qua trang wallet.html
4. ✅ Admin có thể duyệt/từ chối nạp tiền
5. ✅ Tiền tự động cộng vào ví khi admin duyệt
6. ✅ Lịch sử giao dịch được lưu đầy đủ
7. ✅ Code được deploy lên production (Render)
8. ✅ Website hoạt động hoàn chỉnh với Supabase

---

## 🚀 CÁCH BẮT ĐẦU:

1. Mở terminal
2. Chạy: `npm run dev` (hoặc `node server-supabase.js`)
3. Mở: http://localhost:3001
4. Mở file: `public/script.js`
5. Tìm dòng 600: `modalRegisterForm.addEventListener('submit')`
6. Bắt đầu sửa code theo hướng dẫn ở BƯỚC 1

---

## 💡 LƯU Ý QUAN TRỌNG:

1. **Làm từng bước một:** Hoàn thành bước 1 → test → bước 2 → test...
2. **Commit thường xuyên:** Sau mỗi bước hoàn thành
3. **Test kỹ:** Mỗi tính năng phải test trước khi làm tiếp
4. **Backup code:** Trước khi sửa file quan trọng
5. **Kiểm tra console:** Xem có lỗi API không
6. **Kiểm tra Supabase:** Xem data có lưu đúng không
7. **Không vội deploy:** Test kỹ local trước

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP:

**Lỗi 1: API không kết nối được**
```javascript
// Kiểm tra authToken có được gửi không
console.log('Auth Token:', authToken);

// Kiểm tra response
console.log('API Response:', data);
```

**Lỗi 2: CORS error**
- Kiểm tra server có `app.use(cors())` không
- Kiểm tra Supabase URL đúng chưa

**Lỗi 3: JWT token invalid**
- Kiểm tra JWT_SECRET trong .env
- Kiểm tra token có lưu đúng không

**Lỗi 4: Supabase connection failed**
- Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY
- Kiểm tra internet connection

---

## 📞 HỖ TRỢ:

Nếu gặp khó khăn, hãy hỏi tôi:
- Lỗi API không hoạt động
- Không biết sửa code ở đâu
- Cần giải thích thêm về flow
- Lỗi khi deploy lên Render

**Chúc bạn làm việc hiệu quả! 💪🚀**
