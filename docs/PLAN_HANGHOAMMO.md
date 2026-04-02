# KẾ HOẠCH DỰ ÁN - HANGHOAMMO
## Nền tảng mua bán tài khoản & dịch vụ số

---

**Tên dự án:** HangHoaMMO  
**Tác giả:** Nguyễn Hữu Kiên  
**Email:** huukiennguyen711@gmail.com  
**Website:** https://hanghoammo.onrender.com  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 29/03/2026  

---

## MỤC LỤC

1. Tổng quan dự án
2. Công nghệ sử dụng
3. Kiến trúc hệ thống
4. Cấu trúc thư mục
5. Database Schema
6. API Endpoints
7. Tính năng chi tiết
8. Bảo mật
9. Triển khai (Deploy)
10. Kế hoạch phát triển tiếp theo

---

## 1. TỔNG QUAN DỰ ÁN

HangHoaMMO là một nền tảng thương mại điện tử chuyên bán tài khoản và dịch vụ số (MMO - Make Money Online).
Hệ thống cho phép người dùng mua tài khoản game, phần mềm, dịch vụ streaming... với giao hàng tự động tức thì.

**Mục tiêu:**
- Tự động hóa hoàn toàn quy trình bán hàng số
- Bảo mật cao, chống gian lận
- Trải nghiệm người dùng mượt mà
- Quản lý dễ dàng qua Admin Panel

**Live Demo:** https://hanghoammo.onrender.com

---

## 2. CÔNG NGHỆ SỬ DỤNG

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | >= 18.0.0 | Runtime |
| Express.js | 4.18.2 | Web framework |
| @supabase/supabase-js | 2.38.4 | Database client |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcryptjs | 2.4.3 | Password hashing |
| express-rate-limit | 7.1.5 | Rate limiting |
| express-slow-down | 3.1.0 | Brute force protection |
| express-validator | 7.3.1 | Input validation |
| helmet | 7.1.0 | HTTP security headers |
| hpp | 0.2.3 | HTTP Parameter Pollution |
| morgan | 1.10.1 | Request logging |
| cors | 2.8.5 | CORS protection |
| compression | 1.8.1 | GZIP compression |
| cookie-parser | 1.4.7 | Cookie handling |
| express-fileupload | 1.5.2 | File upload |
| nodemailer | 8.0.2 | Email (fallback) |
| axios | 1.6.2 | HTTP client |
| openai | 6.27.0 | OpenAI API |
| speakeasy | 2.0.0 | 2FA/TOTP |
| qrcode | 1.5.4 | QR code generation |
| pdfkit | 0.15.0 | PDF generation |
| moment | 2.30.1 | Date/time |
| ua-parser-js | 1.0.37 | User agent parsing |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| HTML5 | Cấu trúc trang |
| CSS3 | Giao diện |
| Vanilla JavaScript | Logic frontend |
| Font Awesome | Icons |

### Dịch vụ bên ngoài
| Dịch vụ | Mục đích |
|---------|----------|
| Supabase | PostgreSQL database + Storage |
| Brevo (Sendinblue) | Gửi email |
| Telegram Bot API | Thông báo Telegram |
| VietQR API | Tạo QR code thanh toán |
| VNPay Sandbox | Cổng thanh toán VNPay |
| Momo | Cổng thanh toán Momo |
| ZaloPay | Cổng thanh toán ZaloPay |
| Groq API | AI Chatbot (miễn phí) |
| Google Gemini | AI Chatbot (backup) |
| Render | Hosting backend + frontend |

---

## 3. KIẾN TRÚC HỆ THỐNG

```
[Browser / Client]
        |
        | HTTPS
        v
[Render.com - Node.js Server]
        |
        |-- Static Files (public/)
        |-- API Routes (/api/*)
        |       |
        |       |-- Auth Middleware (JWT + Cookie)
        |       |-- CSRF Protection
        |       |-- Rate Limiting
        |       |-- Input Validation
        |
        v
[Supabase PostgreSQL]
        |
        |-- users, wallet, products
        |-- accounts, orders, order_items
        |-- transactions, deposit_requests
        |-- reviews, wishlist, vouchers
        |-- affiliate, reseller, blog_posts
        |-- chat_messages, ai_chat_history
        |-- analytics_events, flash_sales
        |
[Supabase Storage]
        |-- product-images/

[External Services]
        |-- Brevo (Email)
        |-- Telegram Bot API
        |-- VietQR API
        |-- Payment Gateways (VNPay, Momo, ZaloPay)
        |-- Groq / Gemini (AI)
```

---

## 4. CẤU TRÚC THƯ MỤC

```
hanghoammo/
├── server-supabase.js          # Entry point - Main server
├── package.json                # Dependencies
├── .env                        # Environment variables (không commit)
├── render.yaml                 # Render deploy config
│
├── src/
│   ├── config/
│   │   ├── database.js         # Database helper functions
│   │   └── supabase.js         # Supabase client (anon + admin)
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT auth + token blacklist
│   │   └── validate.js         # Input validation rules
│   │
│   ├── models/
│   │   ├── Account.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   │
│   ├── routes/                 # 20 route files
│   │   ├── auth.js             # Đăng ký, đăng nhập, OTP, 2FA
│   │   ├── products.js         # CRUD sản phẩm
│   │   ├── orders.js           # Tạo & quản lý đơn hàng
│   │   ├── wallet.js           # Ví tiền, nạp tiền
│   │   ├── admin.js            # Admin dashboard
│   │   ├── payment.js          # VNPay, Momo, ZaloPay
│   │   ├── reviews.js          # Đánh giá sản phẩm
│   │   ├── wishlist.js         # Danh sách yêu thích
│   │   ├── vouchers.js         # Mã giảm giá
│   │   ├── affiliate.js        # Hệ thống affiliate
│   │   ├── reseller.js         # Hệ thống reseller
│   │   ├── blog.js             # Blog posts
│   │   ├── analytics.js        # Thống kê
│   │   ├── chat.js             # Chat user-admin
│   │   ├── ai-chat.js          # AI chatbot
│   │   ├── upload.js           # Upload ảnh (admin only)
│   │   ├── stock.js            # Quản lý kho
│   │   ├── telegram.js         # Telegram webhook
│   │   ├── system.js           # Sitemap, SEO
│   │   └── setup.js            # One-time admin setup
│   │
│   ├── services/
│   │   ├── emailService.js     # Brevo email API
│   │   ├── telegramService.js  # Telegram bot
│   │   ├── paymentService.js   # Payment gateways
│   │   ├── twoFactorService.js # 2FA/TOTP
│   │   ├── pdfService.js       # PDF generation
│   │   └── seoService.js       # SEO utilities
│   │
│   └── utils/
│       └── cookies.js          # Cookie helpers
│
├── public/                     # Frontend (24 HTML pages)
│   ├── index.html              # Trang chủ
│   ├── products.html           # Danh sách sản phẩm
│   ├── product-detail.html     # Chi tiết sản phẩm
│   ├── checkout.html           # Thanh toán
│   ├── orders.html             # Lịch sử đơn hàng
│   ├── profile.html            # Tài khoản cá nhân
│   ├── wallet.html             # Ví tiền
│   ├── admin.html              # Admin panel
│   ├── affiliate.html          # Affiliate program
│   ├── reseller.html           # Reseller dashboard
│   ├── wishlist.html           # Danh sách yêu thích
│   ├── blog.html               # Chi tiết blog
│   ├── blog-list.html          # Danh sách blog
│   ├── analytics.html          # Analytics (admin)
│   ├── forgot-password.html    # Quên mật khẩu
│   ├── register1.html          # Đăng ký bước 1
│   ├── register2.html          # Đăng ký bước 2
│   ├── signup.html             # Đăng ký
│   ├── upload-image.html       # Upload ảnh
│   ├── setup-admin.html        # Setup admin
│   ├── language-switcher.html  # Chuyển ngôn ngữ
│   ├── sitemap.xml             # SEO sitemap
│   ├── robots.txt              # SEO robots
│   │
│   ├── css/                    # 9 CSS files
│   │   ├── style.css           # Main styles
│   │   ├── style-v2.css        # Updated styles
│   │   ├── admin.css           # Admin styles
│   │   ├── profile.css         # Profile styles
│   │   ├── product-detail.css  # Product detail
│   │   ├── products-improved.css
│   │   ├── reviews-wishlist.css
│   │   ├── reseller.css
│   │   └── ai-chatbot.css
│   │
│   └── js/                     # 14 JavaScript files
│       ├── script.js           # Core (auth, cart, products)
│       ├── admin.js            # Admin dashboard
│       ├── profile.js          # Profile management
│       ├── products-page.js    # Products filter/sort
│       ├── payment-ui.js       # Payment UI
│       ├── wallet.js           # Wallet operations
│       ├── reviews.js          # Product reviews
│       ├── wishlist.js         # Wishlist
│       ├── voucher.js          # Voucher/coupon
│       ├── ai-chatbot.js       # AI chatbot UI
│       ├── reseller.js         # Reseller dashboard
│       ├── stock-manager.js    # Stock management
│       ├── i18n.js             # Internationalization
│       └── sitemap-generator.js
│
├── database/                   # 25 SQL migration files
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
└── tests/                      # Test files
```

---

## 5. DATABASE SCHEMA

### Tổng quan: 20+ bảng trong Supabase PostgreSQL

---

### 5.1 Bảng USERS (Người dùng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| email | VARCHAR(255) UNIQUE | Email đăng nhập |
| password | VARCHAR(255) | Mật khẩu đã hash (bcrypt) |
| name | VARCHAR(255) | Tên hiển thị |
| phone | VARCHAR(20) | Số điện thoại |
| role | VARCHAR(20) | 'user' hoặc 'admin' |
| status | VARCHAR(20) | 'active', 'banned', 'disabled' |
| email_verified | BOOLEAN | Đã xác thực email chưa |
| verification_token | TEXT | Token xác thực email |
| verification_expires | TIMESTAMP | Hạn token xác thực |
| reset_token | TEXT | Token reset mật khẩu |
| reset_expires | TIMESTAMP | Hạn token reset |
| telegram_chat_id | VARCHAR(50) | Chat ID Telegram |
| two_factor_enabled | BOOLEAN | Bật 2FA chưa |
| two_factor_secret | TEXT | Secret key 2FA |
| tier | VARCHAR(20) | Cấp độ user (bronze/silver/gold) |
| created_at | TIMESTAMP | Ngày tạo |
| updated_at | TIMESTAMP | Ngày cập nhật |

---

### 5.2 Bảng WALLET (Ví tiền)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| user_id | UUID (FK) | Liên kết users |
| balance | DECIMAL(15,2) | Số dư hiện tại |
| created_at | TIMESTAMP | Ngày tạo |
| updated_at | TIMESTAMP | Ngày cập nhật |

---

### 5.3 Bảng PRODUCTS (Sản phẩm)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| name | VARCHAR(255) | Tên sản phẩm |
| category | VARCHAR(50) | Danh mục (ai, design, entertainment...) |
| price | DECIMAL(10,2) | Giá bán |
| image | TEXT | URL ảnh |
| badge | VARCHAR(20) | HOT / NEW / SALE |
| sold | INTEGER | Số lượng đã bán |
| description | TEXT | Mô tả sản phẩm |
| section | VARCHAR(50) | best_sellers / new_products / hot_products |
| stock_count | INTEGER | Số tài khoản còn lại |
| created_at | TIMESTAMP | Ngày tạo |
| updated_at | TIMESTAMP | Ngày cập nhật |

---

### 5.4 Bảng ACCOUNTS (Tài khoản bán)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| product_id | UUID (FK) | Liên kết products |
| username | VARCHAR(255) | Tên đăng nhập tài khoản |
| password | VARCHAR(255) | Mật khẩu tài khoản |
| status | VARCHAR(20) | 'available' / 'sold' / 'reserved' |
| sold_to | UUID (FK) | User đã mua |
| sold_at | TIMESTAMP | Thời điểm bán |
| created_at | TIMESTAMP | Ngày tạo |

---

### 5.5 Bảng ORDERS (Đơn hàng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| order_code | VARCHAR(50) UNIQUE | Mã đơn hàng (DH + timestamp) |
| user_id | UUID (FK) | Người mua |
| total | DECIMAL(10,2) | Tổng tiền |
| payment_method | VARCHAR(50) | wallet / vnpay / momo / zalopay |
| status | VARCHAR(20) | pending / completed / cancelled |
| voucher_id | UUID (FK) | Voucher đã dùng |
| discount_amount | DECIMAL(10,2) | Số tiền giảm |
| note | TEXT | Ghi chú |
| created_at | TIMESTAMP | Ngày tạo |
| updated_at | TIMESTAMP | Ngày cập nhật |

---

### 5.6 Bảng ORDER_ITEMS (Chi tiết đơn hàng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| order_id | UUID (FK) | Liên kết orders |
| product_id | UUID (FK) | Liên kết products |
| product_name | VARCHAR(255) | Tên sản phẩm (snapshot) |
| product_price | DECIMAL(10,2) | Giá tại thời điểm mua |
| quantity | INTEGER | Số lượng |
| account_id | UUID (FK) | Tài khoản đã giao |
| created_at | TIMESTAMP | Ngày tạo |

---

### 5.7 Bảng TRANSACTIONS (Giao dịch ví)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| user_id | UUID (FK) | Người dùng |
| type | VARCHAR(20) | deposit / purchase / refund |
| amount | DECIMAL(10,2) | Số tiền |
| balance_before | DECIMAL(10,2) | Số dư trước |
| balance_after | DECIMAL(10,2) | Số dư sau |
| description | TEXT | Mô tả giao dịch |
| order_id | UUID (FK) | Liên kết đơn hàng |
| status | VARCHAR(20) | pending / completed / failed |
| created_at | TIMESTAMP | Ngày tạo |

---

### 5.8 Bảng DEPOSIT_REQUESTS (Yêu cầu nạp tiền)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| user_id | UUID (FK) | Người yêu cầu |
| amount | DECIMAL(10,2) | Số tiền nạp |
| payment_method | VARCHAR(50) | Phương thức thanh toán |
| transaction_code | VARCHAR(100) | Mã giao dịch ngân hàng |
| status | VARCHAR(20) | pending / approved / rejected |
| note | TEXT | Nội dung chuyển khoản |
| admin_note | TEXT | Ghi chú admin |
| reject_reason | TEXT | Lý do từ chối |
| created_at | TIMESTAMP | Ngày tạo |
| updated_at | TIMESTAMP | Ngày cập nhật |

---

### 5.9 Bảng VOUCHERS (Mã giảm giá)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | ID tự động |
| code | VARCHAR(50) UNIQUE | Mã voucher |
| type | VARCHAR(20) | percent / fixed |
| value | DECIMAL(10,2) | Giá trị giảm |
| min_order | DECIMAL(10,2) | Đơn tối thiểu |
| max_discount | DECIMAL(10,2) | Giảm tối đa |
| usage_limit | INTEGER | Giới hạn sử dụng |
| used_count | INTEGER | Đã dùng bao nhiêu lần |
| expires_at | TIMESTAMP | Ngày hết hạn |
| active | BOOLEAN | Đang hoạt động |
| created_at | TIMESTAMP | Ngày tạo |

---

### 5.10 Các bảng khác
| Bảng | Mô tả |
|------|-------|
| reviews | Đánh giá sản phẩm (rating 1-5, comment) |
| wishlist | Danh sách yêu thích của user |
| affiliate | Hệ thống giới thiệu (referral code, commission) |
| reseller | Hệ thống đại lý (tier, discount rate) |
| blog_posts | Bài viết blog (title, content, slug, tags) |
| chat_messages | Tin nhắn chat user-admin |
| ai_chat_history | Lịch sử chat với AI |
| analytics_events | Sự kiện analytics (page_view, click...) |
| password_reset_otps | OTP đặt lại mật khẩu |
| flash_sales | Flash sale theo thời gian |

---

## 6. API ENDPOINTS

### 6.1 Authentication (/api/auth)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /register | Không | Đăng ký tài khoản mới |
| POST | /login | Không | Đăng nhập |
| POST | /logout | Không | Đăng xuất (xóa cookie + blacklist token) |
| GET | /me | Có | Lấy thông tin user hiện tại |
| POST | /forgot-password | Không | Gửi link reset mật khẩu qua email |
| POST | /reset-password | Không | Đặt lại mật khẩu bằng token |
| GET | /verify-email | Không | Xác thực email |
| POST | /request-forgot-password-otp | Không | Gửi OTP quên mật khẩu |
| POST | /change-password | Không | Đổi mật khẩu (quên MK + OTP) |
| POST | /request-password-otp | Có | Gửi OTP đổi mật khẩu (đã đăng nhập) |
| POST | /change-password-auth | Có | Đổi mật khẩu (đã đăng nhập + OTP) |
| POST | /update-profile | Có | Cập nhật tên, số điện thoại |
| POST | /update-telegram | Có | Cập nhật Telegram Chat ID |
| POST | /2fa/setup | Có | Thiết lập 2FA |
| POST | /2fa/verify | Có | Xác thực 2FA khi đăng nhập |
| POST | /2fa/disable | Có | Tắt 2FA |

---

### 6.2 Products (/api/products)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | / | Không | Lấy danh sách sản phẩm (filter, sort, search) |
| GET | /:id | Không | Lấy chi tiết sản phẩm |
| POST | / | Admin | Tạo sản phẩm mới |
| PUT | /:id | Admin | Cập nhật sản phẩm |
| DELETE | /:id | Admin | Xóa sản phẩm |

---

### 6.3 Orders (/api/orders)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /create | Có | Tạo đơn hàng + giao tài khoản tự động |
| GET | /my-orders | Có | Lấy lịch sử đơn hàng của user |

---

### 6.4 Wallet (/api/wallet)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | / | Có | Lấy số dư ví |
| GET | /transactions | Có | Lịch sử giao dịch |
| GET | /deposits | Có | Danh sách yêu cầu nạp tiền |
| POST | /deposit | Có | Tạo yêu cầu nạp tiền |

---

### 6.5 Admin (/api/admin)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /deposits | Admin | Danh sách yêu cầu nạp tiền |
| POST | /approve-deposit | Admin | Duyệt nạp tiền |
| POST | /reject-deposit | Admin | Từ chối nạp tiền |
| GET | /users | Admin | Danh sách người dùng |
| GET | /orders | Admin | Danh sách đơn hàng |
| GET | /accounts | Admin | Danh sách tài khoản game |
| POST | /accounts | Admin | Thêm tài khoản game (bulk) |
| DELETE | /accounts/:id | Admin | Xóa tài khoản game |
| GET | /transactions | Admin | Tất cả giao dịch |
| GET | /chats | Admin | Tất cả hội thoại chat |
| GET | /analytics | Admin | Thống kê tổng quan |
| GET | /analytics/top-pages | Admin | Trang được xem nhiều nhất |
| GET | /analytics/recent-events | Admin | Sự kiện gần đây |
| GET | /notifications | Admin | Danh sách thông báo |
| POST | /notifications | Admin | Tạo thông báo |
| DELETE | /notifications/:id | Admin | Xóa thông báo |
| GET | /settings | Admin | Lấy cài đặt hệ thống |
| PUT | /settings | Admin | Cập nhật cài đặt |

---

### 6.6 Payment (/api/payment)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /vnpay/create | Có | Tạo link thanh toán VNPay |
| GET | /vnpay/callback | Không | Callback từ VNPay |
| POST | /momo/create | Có | Tạo link thanh toán Momo |
| POST | /momo/callback | Không | Callback từ Momo |
| POST | /zalopay/create | Có | Tạo link thanh toán ZaloPay |
| POST | /zalopay/callback | Không | Callback từ ZaloPay |

---

### 6.7 Các API khác
| Route | Mô tả |
|-------|-------|
| /api/reviews | CRUD đánh giá sản phẩm |
| /api/wishlist | Thêm/xóa/xem danh sách yêu thích |
| /api/vouchers | Tạo/áp dụng/validate voucher |
| /api/affiliate | Quản lý affiliate, referral |
| /api/reseller | Quản lý reseller, tier, discount |
| /api/blog | CRUD blog posts |
| /api/analytics | Ghi nhận và xem analytics |
| /api/chat | Chat giữa user và admin |
| /api/ai-chat | Chat với AI (Groq/Gemini) |
| /api/upload-image | Upload ảnh sản phẩm (Admin) |
| /api/stock | Quản lý tồn kho |
| /api/telegram | Telegram webhook |
| /api/health | Health check |

---

## 7. TÍNH NĂNG CHI TIẾT

### 7.1 Xác thực & Tài khoản
- **Đăng ký:** Tên, email, số điện thoại, mật khẩu (yêu cầu chữ hoa + chữ thường + số)
- **Đăng nhập:** Email + mật khẩu, hỗ trợ 2FA (TOTP)
- **Xác thực email:** Gửi link xác thực qua email sau khi đăng ký
- **Quên mật khẩu:** Gửi OTP 6 số qua email + Telegram (nếu có)
- **Đổi mật khẩu:** Yêu cầu mật khẩu cũ + OTP xác nhận
- **2FA (Two-Factor Authentication):** Dùng Google Authenticator / Authy
- **Telegram liên kết:** User nhập Chat ID để nhận thông báo qua Telegram
- **Cấp độ user (Tier):** Bronze → Silver → Gold (dựa trên tổng chi tiêu)

---

### 7.2 Sản phẩm
- **Danh sách sản phẩm:** Phân trang, lọc theo danh mục, sắp xếp theo giá/bán chạy
- **Tìm kiếm:** Real-time search với debounce
- **Chi tiết sản phẩm:** Mô tả, đánh giá, tồn kho, sản phẩm liên quan
- **Danh mục:** AI, Design, Entertainment, Email, Game, Software...
- **Badge:** HOT / NEW / SALE
- **Section:** Bán chạy / Mới nhất / Tìm kiếm hàng đầu / Gợi ý
- **Tồn kho:** Hiển thị số lượng còn lại, cảnh báo sắp hết hàng

---

### 7.3 Giỏ hàng & Thanh toán
- **Giỏ hàng:** Thêm/xóa/cập nhật số lượng, lưu trong localStorage
- **Voucher:** Nhập mã giảm giá, validate real-time
- **Phương thức thanh toán:**
  - Ví HangHoaMMO (giao hàng tức thì)
  - ZaloPay (QR / ATM / Visa)
  - Momo (ví điện tử)
  - VNPay (ngân hàng / QR)
- **Giao hàng tự động:** Tài khoản game hiển thị ngay sau thanh toán thành công
- **Xác nhận đơn hàng:** Gửi email + Telegram với thông tin tài khoản đã mua

---

### 7.4 Ví tiền
- **Số dư:** Hiển thị real-time
- **Nạp tiền:** Chuyển khoản ngân hàng (VietinBank, MBBank, ZaloPay, Momo, VNPay)
- **QR Code động:** Tự động tạo QR với số tiền và nội dung chuyển khoản
- **Lịch sử giao dịch:** Nạp tiền, mua hàng, hoàn tiền
- **Admin duyệt:** Admin xem và duyệt/từ chối yêu cầu nạp tiền

---

### 7.5 Admin Panel
- **Dashboard:** Tổng doanh thu, đơn hàng, khách hàng, sản phẩm
- **Quản lý sản phẩm:** Thêm/sửa/xóa, upload ảnh lên Supabase Storage
- **Quản lý tài khoản game:** Thêm bulk (nhiều tài khoản cùng lúc), xóa
- **Quản lý đơn hàng:** Xem chi tiết, cập nhật trạng thái
- **Quản lý khách hàng:** Xem thông tin, lịch sử mua hàng
- **Duyệt nạp tiền:** Approve/reject với validation chặt chẽ
- **Quản lý voucher:** Tạo mã giảm giá theo % hoặc số tiền cố định
- **Analytics:** Thống kê lượt xem, sự kiện, trang phổ biến
- **Chat:** Trả lời tin nhắn từ khách hàng
- **Thông báo:** Tạo thông báo hệ thống
- **Cài đặt:** Bảo trì, thông tin shop

---

### 7.6 Thông báo đa kênh
- **Email (Brevo API):**
  - Chào mừng đăng ký
  - Xác thực email
  - Xác nhận đơn hàng (kèm tài khoản game)
  - Nạp tiền được duyệt
  - OTP đổi mật khẩu
  - Thông báo đổi mật khẩu thành công
  - Link reset mật khẩu
- **Telegram Bot:**
  - Thông báo đăng ký mới (vào nhóm admin)
  - Thông báo đặt hàng (user + admin)
  - Nạp tiền được duyệt
  - OTP qua Telegram
  - Cảnh báo đổi mật khẩu
  - Tin tức MMO tự động (MMO News Bot)

---

### 7.7 AI Chatbot
- **Groq API** (miễn phí, ưu tiên): Llama 3, Mixtral
- **Google Gemini** (backup): Gemini Pro
- **OpenAI** (tùy chọn): GPT-4
- Lưu lịch sử chat trong database
- Hỗ trợ context về sản phẩm và dịch vụ

---

### 7.8 Affiliate & Reseller
- **Affiliate:** Mỗi user có referral code riêng, nhận hoa hồng khi giới thiệu
- **Reseller:** Hệ thống đại lý với tier và discount rate khác nhau
- **User Tier:** Bronze / Silver / Gold dựa trên tổng chi tiêu

---

### 7.9 Blog
- Tạo/sửa/xóa bài viết
- Slug URL thân thiện SEO
- Tags và categories
- Trang danh sách và chi tiết

---

### 7.10 SEO & Analytics
- **Sitemap XML** tự động
- **robots.txt** cấu hình
- **Meta tags** cho từng trang
- **Analytics events:** Ghi nhận page view, click, purchase
- **Internationalization (i18n):** Hỗ trợ đa ngôn ngữ

---

## 8. BẢO MẬT

### 8.1 Authentication & Authorization
| Lớp | Cơ chế |
|-----|--------|
| JWT Token | Expire 7 ngày, ký bằng secret >= 32 ký tự |
| httpOnly Cookie | Token lưu trong cookie, JS không đọc được (chống XSS) |
| Token Blacklist | Logout thực sự revoke token ngay lập tức |
| 2FA (TOTP) | Google Authenticator / Authy |
| User status check | Kiểm tra banned/disabled mỗi request |

---

### 8.2 Rate Limiting & Brute Force Protection
| Loại | Giới hạn |
|------|---------|
| General API | 100 req / 15 phút / IP |
| Auth (login/register) | 5 req / 15 phút / IP |
| OTP requests | 3 req / 5 phút / IP |
| Upload | 10 req / 1 phút / IP |
| Slow Down | Sau 3 lần thất bại: +500ms/req, tối đa 10s |

---

### 8.3 Input Validation & Sanitization
- **express-validator** cho tất cả endpoints
- Password: min 8 ký tự, phải có chữ hoa + chữ thường + số
- Email: normalize, max 255 ký tự
- Text fields: `.escape()` chống XSS
- UUID params: validate format
- Amount: min/max bounds, chống negative injection
- File upload: validate MIME type + extension + size

---

### 8.4 HTTP Security Headers (Helmet.js)
| Header | Giá trị |
|--------|---------|
| Content-Security-Policy | Whitelist cụ thể cho scripts, styles, fonts, images |
| X-Frame-Options | DENY (chống clickjacking) |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| HSTS | maxAge=31536000 (production) |
| DNS Prefetch Control | Tắt |

---

### 8.5 CSRF Protection
- Double Submit Cookie Pattern
- Server tạo `csrfToken` cookie (JS đọc được)
- Frontend gửi lại qua header `X-CSRF-Token`
- Attacker không thể đọc cookie từ domain khác

---

### 8.6 Các bảo vệ khác
- **CORS:** Whitelist domain cụ thể
- **HPP:** Chống HTTP Parameter Pollution
- **Body limit:** 1MB (chống DoS)
- **GZIP:** Compression giảm bandwidth
- **Env validation:** Server không start nếu thiếu biến quan trọng
- **Error messages:** Production không leak stack trace
- **Upload auth:** Chỉ admin mới upload được ảnh
- **Deposit validation:** Verify deposit tồn tại + pending trước khi approve

---

## 9. TRIỂN KHAI (DEPLOY)

### 9.1 Môi trường
| Môi trường | URL | Mô tả |
|------------|-----|-------|
| Production | https://hanghoammo.onrender.com | Render.com |
| Development | http://localhost:3002 | Local |

---

### 9.2 Render.com Configuration (render.yaml)
- **Service type:** Web Service
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Node version:** >= 18.0.0
- **Auto deploy:** Khi push lên GitHub main branch

---

### 9.3 Environment Variables cần thiết
| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| JWT_SECRET | Có | >= 32 ký tự |
| SUPABASE_URL | Có | URL Supabase project |
| SUPABASE_ANON_KEY | Có | Anon key |
| SUPABASE_SERVICE_ROLE_KEY | Có | Service role key |
| NODE_ENV | Có | production / development |
| PORT | Không | Mặc định 3001 |
| BASE_URL | Có | URL production |
| ALLOWED_ORIGINS | Có | Danh sách domain CORS |
| BREVO_API_KEY | Có | Gửi email |
| TELEGRAM_BOT_TOKEN | Không | Thông báo Telegram |
| TELEGRAM_ADMIN_CHAT_ID | Không | Chat ID nhóm admin |
| GROQ_API_KEY | Không | AI chatbot |
| GEMINI_API_KEY | Không | AI chatbot backup |
| VNPAY_TMN_CODE | Không | VNPay |
| VNPAY_HASH_SECRET | Không | VNPay |
| MOMO_PARTNER_CODE | Không | Momo |
| ZALOPAY_APP_ID | Không | ZaloPay |

---

### 9.4 Database Setup
1. Tạo project trên Supabase
2. Chạy `database/database-schema.sql` trong SQL Editor
3. Chạy các file migration theo thứ tự:
   - `create-otp-table.sql`
   - `create-accounts-table.sql`
   - `add-email-verification.sql`
   - `add-telegram-field.sql`
   - `add-2fa-support.sql`
   - `add-status-column.sql`
   - `create-vouchers-table.sql`
   - `add-voucher-to-orders.sql`
   - `create-reviews-table.sql`
   - `create-wishlist-table.sql`
   - `create-affiliate-table.sql`
   - `create-reseller-system.sql`
   - `create-blog-table.sql`
   - `create-chat-table.sql`
   - `create-ai-chat-table.sql`
   - `create-analytics-table.sql`
   - `create-flash-sales-table.sql`
   - `add-section-to-products.sql`
   - `add-stock-management.sql`
   - `add-performance-indexes.sql`
   - `fix-race-condition-claim-account.sql`
   - `setup-storage-policies.sql`
4. Tạo Storage bucket `product-images` (public)
5. Chạy `node scripts/create-admin.js` để tạo tài khoản admin

---

## 10. KẾ HOẠCH PHÁT TRIỂN TIẾP THEO

### 10.1 Ưu tiên cao (Cần làm sớm)
- [ ] Thêm unit tests (Jest/Mocha) cho các route quan trọng
- [ ] Thêm error tracking (Sentry)
- [ ] Tối ưu performance: Redis cache cho products
- [ ] Thêm Swagger/OpenAPI documentation
- [ ] Trang quản lý flash sales hoàn chỉnh
- [ ] Hệ thống refund/hoàn tiền

### 10.2 Ưu tiên trung bình
- [ ] Mobile app (React Native hoặc PWA)
- [ ] Hệ thống review sản phẩm hoàn chỉnh (ảnh, video)
- [ ] Tích hợp thêm cổng thanh toán (PayPal, Stripe)
- [ ] Hệ thống loyalty points
- [ ] Push notifications (Web Push API)
- [ ] Live chat real-time (WebSocket)

### 10.3 Ưu tiên thấp
- [ ] Multi-language hoàn chỉnh (EN/VI)
- [ ] Dark mode
- [ ] Export báo cáo PDF/Excel
- [ ] API public cho reseller
- [ ] Tích hợp Google Analytics
- [ ] A/B testing

---

## THỐNG KÊ DỰ ÁN

| Mục | Số lượng |
|-----|---------|
| Files tổng cộng | 100+ |
| Lines of code | ~20,000 |
| Database tables | 20+ |
| API endpoints | 60+ |
| HTML pages | 24 |
| JavaScript files | 14 |
| CSS files | 9 |
| SQL migration files | 25 |
| Dependencies | 24 packages |

---

*Tài liệu này được tạo tự động từ codebase HangHoaMMO - Cập nhật: 29/03/2026*
