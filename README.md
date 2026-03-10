# 🛍️ HangHoaMMO - Shop Tài Khoản & Dịch Vụ Số

> Nền tảng mua bán tài khoản, dịch vụ số uy tín hàng đầu Việt Nam

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://hanghoammo.onrender.com)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🌟 Tính năng nổi bật

### 🔐 Bảo mật cao
- ✅ OTP xác thực 2 lớp (Email + Telegram)
- ✅ Rate limiting chống spam
- ✅ JWT authentication
- ✅ Password hashing với bcrypt
- ✅ Helmet.js protection

### 💰 Hệ thống ví hoàn chỉnh
- ✅ Nạp tiền với QR VietinBank động
- ✅ Lịch sử giao dịch chi tiết
- ✅ Admin duyệt nạp tiền
- ✅ Thanh toán bằng ví

### 🎮 Giao hàng tự động
- ✅ Tài khoản game tự động giao
- ✅ Hiển thị ngay sau thanh toán
- ✅ Gửi qua email
- ✅ Lưu trong đơn hàng

### 📧 Thông báo đa kênh
- ✅ Email (Brevo API)
- ✅ Telegram Bot
- ✅ Realtime trong app

### 👨‍💼 Admin Panel mạnh mẽ
- ✅ Quản lý toàn bộ hệ thống
- ✅ Thêm tài khoản game hàng loạt
- ✅ Duyệt nạp tiền
- ✅ Xem thống kê

---

## 🚀 Demo

**Website:** https://hanghoammo.onrender.com

**Tài khoản Admin:**
- Email: `huukiennguyen711@gmail.com`
- Password: `12345678`

---

## 📦 Cài đặt

### Yêu cầu
- Node.js >= 18.0.0
- npm hoặc yarn
- Tài khoản Supabase
- Tài khoản Brevo (Email)
- Telegram Bot Token (tùy chọn)

### Bước 1: Clone repository
```bash
git clone https://github.com/nguyenhuukien2-lab/hanghoammo.git
cd hanghoammo
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
Tạo file `.env` và cấu hình:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SMTP_USER=your_smtp_user
BREVO_SMTP_KEY=your_smtp_key

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Bước 4: Tạo database
Chạy SQL trong Supabase SQL Editor (xem file `database-schema.sql` và `create-otp-table.sql`)

### Bước 5: Chạy server
```bash
# Development
npm run dev

# Production
npm start
```

Server sẽ chạy tại: http://localhost:3001

---

## 📁 Cấu trúc dự án

```
hanghoammo/
├── config/
│   ├── database.js          # Database helper functions
│   └── supabase.js          # Supabase client
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── Account.js
│   ├── Order.js
│   ├── Product.js
│   └── User.js
├── routes/
│   ├── admin.js             # Admin routes
│   ├── auth.js              # Authentication routes
│   ├── orders.js            # Orders routes
│   ├── products.js          # Products routes
│   ├── setup.js             # Setup routes
│   └── wallet.js            # Wallet routes
├── services/
│   ├── emailService.js      # Email service (Brevo)
│   └── telegramService.js   # Telegram bot service
├── public/
│   ├── admin.html           # Admin panel
│   ├── blog.html            # Blog page
│   ├── checkout.html        # Checkout page
│   ├── index.html           # Homepage
│   ├── orders.html          # Orders page
│   ├── products.html        # Products page
│   ├── profile.html         # Profile page
│   ├── wallet.html          # Wallet page
│   ├── script.js            # Main JavaScript
│   └── style.css            # Main CSS
├── .env                     # Environment variables
├── server-supabase.js       # Main server file
└── package.json
```

---

## 🗄️ Database Schema

### Tables:
1. **users** - Người dùng
2. **wallet** - Ví tiền
3. **products** - Sản phẩm
4. **accounts** - Tài khoản game
5. **orders** - Đơn hàng
6. **order_items** - Chi tiết đơn hàng
7. **transactions** - Giao dịch
8. **deposit_requests** - Yêu cầu nạp tiền
9. **password_reset_otps** - OTP đổi mật khẩu

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/change-password` - Đổi mật khẩu (có OTP)
- `POST /api/auth/request-password-otp` - Yêu cầu OTP (đã đăng nhập)
- `POST /api/auth/request-forgot-password-otp` - Yêu cầu OTP (quên MK)
- `POST /api/auth/change-password-auth` - Đổi MK (đã đăng nhập + OTP)
- `POST /api/auth/update-profile` - Cập nhật profile
- `POST /api/auth/update-telegram` - Cập nhật Telegram Chat ID
- `GET /api/auth/me` - Lấy thông tin user

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)

### Orders
- `POST /api/orders/create` - Tạo đơn hàng
- `GET /api/orders/my-orders` - Lấy đơn hàng của user

### Wallet
- `GET /api/wallet` - Lấy thông tin ví
- `GET /api/wallet/transactions` - Lịch sử giao dịch
- `GET /api/wallet/deposits` - Danh sách yêu cầu nạp tiền
- `POST /api/wallet/deposit` - Tạo yêu cầu nạp tiền

### Admin
- `GET /api/admin/deposits` - Danh sách nạp tiền (Admin)
- `POST /api/admin/approve-deposit` - Duyệt nạp tiền (Admin)
- `POST /api/admin/reject-deposit` - Từ chối nạp tiền (Admin)
- `GET /api/admin/users` - Danh sách users (Admin)
- `GET /api/admin/orders` - Danh sách đơn hàng (Admin)
- `GET /api/admin/accounts` - Danh sách tài khoản game (Admin)
- `POST /api/admin/accounts` - Thêm tài khoản game (Admin)
- `DELETE /api/admin/accounts/:id` - Xóa tài khoản game (Admin)

---

## 📧 Email Templates

Hệ thống gửi email tự động cho:
1. ✉️ Chào mừng khi đăng ký
2. ✉️ Xác nhận đơn hàng (có tài khoản game)
3. ✉️ Thông báo nạp tiền thành công
4. ✉️ Gửi OTP đổi mật khẩu
5. ✉️ Xác nhận đổi mật khẩu thành công

---

## 📱 Telegram Bot

### Setup:
1. Tạo bot tại: https://t.me/BotFather
2. Lấy Bot Token
3. Thêm vào `.env`: `TELEGRAM_BOT_TOKEN=your_token`
4. User mở bot và gửi `/start` để lấy Chat ID
5. User nhập Chat ID vào Profile

### Thông báo:
- 🔔 Đăng ký tài khoản
- 🔔 Đặt hàng thành công
- 🔔 Nạp tiền được duyệt
- 🔔 Đổi mật khẩu
- 🔔 Gửi OTP

---

## 🔒 Security Features

### Rate Limiting:
- General API: 100 requests/15 phút
- Auth (login/register): 5 requests/15 phút
- OTP requests: 3 requests/5 phút

### Protection:
- Helmet.js - HTTP headers security
- JWT - Token authentication
- bcrypt - Password hashing
- OTP - 2-factor authentication
- CORS - Cross-origin protection

---

## 🎨 Technologies

### Backend:
- Node.js + Express.js
- Supabase PostgreSQL
- JWT Authentication
- bcrypt
- express-rate-limit
- helmet.js

### Frontend:
- HTML5, CSS3, JavaScript
- Font Awesome icons
- Responsive design
- Vanilla JS (No framework)

### Services:
- Brevo (Email)
- Telegram Bot API
- VietQR API (QR code)
- Supabase (Database)

### Deploy:
- Render (Backend + Frontend)
- GitHub (Version control)
- Supabase (Database hosting)

---

## 📊 Statistics

- **Files**: 50+ files
- **Lines of code**: 15,000+ lines
- **Database tables**: 9 tables
- **API endpoints**: 30+ endpoints
- **HTML pages**: 10 pages
- **Development time**: 2 days
- **Commits**: 25+ commits

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👨‍💻 Author

**Nguyễn Hữu Kiên**
- Email: huukiennguyen711@gmail.com
- Telegram: @hanghoammo
- Website: https://hanghoammo.onrender.com

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

---

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

## 📞 Support

For support, email huukiennguyen711@gmail.com or join our Telegram channel @hanghoammo
