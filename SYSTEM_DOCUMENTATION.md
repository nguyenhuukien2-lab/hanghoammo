# HangHoaMMO - Hệ Thống Shop MMO Hoàn Chỉnh

## 📋 Tổng Quan Hệ Thống

HangHoaMMO là một hệ thống shop bán tài khoản và dịch vụ số hoàn chỉnh với các tính năng:

- ✅ Quản lý sản phẩm
- ✅ Giỏ hàng và thanh toán
- ✅ Tự động giao tài khoản
- ✅ Quản trị viên (Admin Dashboard)
- ✅ Quản lý khách hàng
- ✅ Hệ thống thông báo
- ✅ Tích hợp Telegram
- ✅ Chế độ bảo trì
- ✅ Dark mode
- ✅ Responsive design
- ✅ SEO optimization

## 🏗️ Cấu Trúc Dự Án

```
hanghoammo/
├── models/                 # Database models
│   ├── Account.js         # Model tài khoản sản phẩm
│   ├── Order.js           # Model đơn hàng
│   ├── Product.js         # Model sản phẩm
│   └── User.js            # Model người dùng
├── routes/                # API routes
│   ├── accounts.js        # Routes quản lý tài khoản
│   ├── admin.js           # Routes admin
│   ├── auth.js            # Routes xác thực
│   ├── orders.js          # Routes đơn hàng
│   ├── payment.js         # Routes thanh toán
│   ├── products.js        # Routes sản phẩm
│   └── users.js           # Routes người dùng
├── middleware/            # Middleware
│   └── auth.js            # Middleware xác thực
├── public/                # Frontend files
│   ├── index.html         # Trang chủ
│   ├── products.html      # Trang sản phẩm
│   ├── product-detail.html # Chi tiết sản phẩm
│   ├── blog.html          # Trang blog
│   ├── checkout.html      # Trang thanh toán
│   ├── profile.html       # Trang profile
│   ├── admin.html         # Trang admin
│   ├── style.css          # CSS chính
│   ├── admin.css          # CSS admin
│   ├── profile.css        # CSS profile
│   ├── checkout-new.css   # CSS checkout
│   ├── script.js          # JavaScript chính
│   ├── admin.js           # JavaScript admin
│   ├── profile.js         # JavaScript profile
│   ├── checkout-new.js    # JavaScript checkout
│   ├── robots.txt         # SEO robots
│   └── sitemap.xml        # SEO sitemap
├── server.js              # Server chính
├── package.json           # Dependencies
├── .env                   # Environment variables
└── start.bat              # Script khởi động

```

## 🚀 Cài Đặt và Chạy

### Yêu Cầu Hệ Thống
- Node.js v14+
- MongoDB (tùy chọn - có thể dùng localStorage)
- NPM hoặc Yarn

### Cài Đặt

```bash
# Clone repository
git clone <repository-url>

# Di chuyển vào thư mục
cd hanghoammo

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
```

### Chạy Ứng Dụng

```bash
# Development mode
npm start

# Hoặc sử dụng start.bat trên Windows
./start.bat
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 📦 Các Tính Năng Chính

### 1. Trang Chủ (index.html)
- Hero banner với thiết kế gradient
- Danh mục sản phẩm
- Sản phẩm nổi bật
- Sản phẩm mới nhất
- Tìm kiếm với dropdown gợi ý
- Banner bảo trì (có thể bật/tắt)
- Modal Telegram

### 2. Trang Sản Phẩm (products.html)
- Breadcrumb navigation
- Thanh tìm kiếm lớn
- Bộ lọc theo giá và danh mục
- Grid sản phẩm với thông tin đầy đủ
- Phân trang
- Responsive design

### 3. Chi Tiết Sản Phẩm (product-detail.html)
- Hình ảnh sản phẩm lớn
- Thông tin chi tiết
- Mô tả tự động theo danh mục
- Nút "Thêm vào giỏ" và "Mua ngay"
- Sản phẩm liên quan
- Breadcrumb

### 4. Giỏ Hàng và Thanh Toán
- Giỏ hàng modal với cập nhật real-time
- Quy trình thanh toán 3 bước:
  1. Xem lại giỏ hàng
  2. Chọn phương thức thanh toán
  3. Xác nhận thành công
- Kiểm tra số dư ví
- Mã giảm giá
- Ghi chú đơn hàng
- **Tự động giao tài khoản sau khi thanh toán**

### 5. Hệ Thống Tài Khoản

#### Đăng Ký/Đăng Nhập
- Modal đăng ký/đăng nhập
- Validation form
- Quên mật khẩu với OTP
- Lưu trữ localStorage hoặc MongoDB

#### Profile Người Dùng (profile.html)
- Thông tin cá nhân
- Lịch sử đơn hàng
- Quản lý ví
- Cài đặt tài khoản
- Công cụ (2FA, Check Facebook)
- Đăng ký bán hàng

### 6. Admin Dashboard (admin.html)

#### Dashboard
- Thống kê tổng quan (sản phẩm, đơn hàng, khách hàng, doanh thu)
- Đơn hàng gần đây
- Top sản phẩm bán chạy

#### Quản Lý Sản Phẩm
- Thêm/sửa/xóa sản phẩm
- Tìm kiếm và lọc
- Upload hình ảnh
- Quản lý danh mục

#### Quản Lý Đơn Hàng
- Danh sách đơn hàng
- Cập nhật trạng thái
- Lọc theo trạng thái
- Xem chi tiết

#### Quản Lý Khách Hàng
- Danh sách khách hàng
- Thống kê đơn hàng
- Tổng chi tiêu

#### Quản Lý Thông Báo
- Thêm/xóa thông báo
- Các loại: info, warning, success, error

#### Cài Đặt
- Bật/tắt chế độ bảo trì
- Chỉnh sửa thông báo bảo trì
- Thông tin shop
- Link Telegram
- **Upload tài khoản sản phẩm**
- Kiểm tra tồn kho tài khoản

### 7. Hệ Thống Tự Động Giao Tài Khoản

#### Cách Hoạt Động:
1. Admin upload danh sách tài khoản cho từng sản phẩm
2. Khi khách hàng đặt hàng và thanh toán thành công
3. Hệ thống tự động:
   - Tìm tài khoản available cho sản phẩm
   - Đánh dấu tài khoản là "sold"
   - Gắn tài khoản vào đơn hàng
   - Hiển thị tài khoản cho khách hàng
   - Gửi email (nếu có cấu hình)

#### Upload Tài Khoản:
```
Format: email:password hoặc username:password
Ví dụ:
account1@email.com:password123
user456:mypass789
test@example.com:securepass
```

### 8. Tính Năng Khác

#### Dark Mode
- Toggle dark/light mode
- Lưu preference vào localStorage
- Áp dụng cho tất cả trang

#### Telegram Integration
- Modal mời tham gia kênh
- Nút floating Telegram
- Auto-show sau 10 giây (tùy chọn)
- Lưu trạng thái đã tham gia

#### Maintenance Mode
- Banner thông báo bảo trì
- Có thể đóng tạm thời
- Admin quản lý từ Settings

#### Search
- Tìm kiếm real-time
- Dropdown gợi ý sản phẩm
- Hiển thị 6 kết quả đầu
- Link "Xem tất cả"

## 🔐 Bảo Mật

### Middleware Bảo Mật
- Helmet.js - Secure HTTP headers
- Rate limiting - Giới hạn request
- CORS configuration
- JWT authentication
- Password hashing (bcrypt)

### Rate Limiting
- API: 100 requests/15 phút
- Auth: 5 attempts/15 phút

## 📊 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (user/admin),
  createdAt: Date
}
```

### Product Model
```javascript
{
  name: String,
  category: String,
  price: Number,
  image: String,
  badge: String,
  sold: Number,
  description: String
}
```

### Order Model
```javascript
{
  user: ObjectId,
  products: [{
    product: ObjectId,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: String,
  paymentStatus: String,
  deliveredAccounts: Array,
  createdAt: Date
}
```

### Account Model
```javascript
{
  productId: ObjectId,
  account: String,
  password: String,
  status: String (available/sold),
  orderId: ObjectId,
  soldAt: Date
}
```

## 🎨 Thiết Kế

### Color Scheme
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Dark Purple)
- Success: #28a745 (Green)
- Danger: #dc3545 (Red)
- Warning: #ffc107 (Yellow)

### Typography
- Font Family: Inter
- Weights: 400, 500, 600, 700, 800

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 📱 API Endpoints

### Authentication
- POST `/api/auth/register` - Đăng ký
- POST `/api/auth/login` - Đăng nhập
- GET `/api/auth/me` - Lấy thông tin user

### Products
- GET `/api/products` - Lấy danh sách sản phẩm
- GET `/api/products/:id` - Lấy chi tiết sản phẩm
- POST `/api/products` - Thêm sản phẩm (Admin)
- PUT `/api/products/:id` - Cập nhật sản phẩm (Admin)
- DELETE `/api/products/:id` - Xóa sản phẩm (Admin)

### Orders
- GET `/api/orders` - Lấy đơn hàng của user
- POST `/api/orders` - Tạo đơn hàng
- GET `/api/orders/:id` - Chi tiết đơn hàng
- PUT `/api/orders/:id` - Cập nhật đơn hàng (Admin)

### Accounts
- POST `/api/accounts/upload` - Upload tài khoản (Admin)
- GET `/api/accounts/product/:productId` - Kiểm tra tồn kho
- POST `/api/accounts/assign` - Gán tài khoản cho đơn hàng
- DELETE `/api/accounts/:id` - Xóa tài khoản (Admin)

### Payment
- POST `/api/payment/create` - Tạo thanh toán
- POST `/api/payment/webhook` - Webhook thanh toán
- GET `/api/payment/status/:orderId` - Kiểm tra trạng thái

## 🔧 Cấu Hình

### Environment Variables (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hanghoammo
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### LocalStorage Keys
- `authToken` - JWT token
- `currentUser` - Thông tin user hiện tại
- `cart` - Giỏ hàng
- `users` - Danh sách users (fallback)
- `adminProducts` - Danh sách sản phẩm
- `orders` - Đơn hàng
- `adminOrders` - Đơn hàng (admin view)
- `adminCustomers` - Khách hàng
- `productAccounts` - Tài khoản sản phẩm
- `maintenanceMode` - Trạng thái bảo trì
- `maintenanceMessage` - Thông báo bảo trì
- `shopTelegram` - Link Telegram
- `darkMode` - Chế độ dark mode
- `telegramJoined` - Đã tham gia Telegram

## 📈 SEO

### Meta Tags
- Title, Description, Keywords
- Open Graph tags
- Twitter Card tags
- Robots meta

### Files
- `robots.txt` - Hướng dẫn crawler
- `sitemap.xml` - Sitemap cho search engines

## 🐛 Troubleshooting

### Port đã được sử dụng
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### MongoDB không kết nối
- Kiểm tra MongoDB đang chạy
- Kiểm tra MONGODB_URI trong .env
- App vẫn hoạt động với localStorage

### Sản phẩm không hiển thị
- Kiểm tra localStorage có dữ liệu
- Mở Console để xem lỗi
- Reload trang để load sample products

## 📝 Hướng Dẫn Sử Dụng

### Cho Admin

1. **Thêm Sản Phẩm**
   - Vào Admin Dashboard
   - Click "Sản phẩm" → "Thêm sản phẩm"
   - Điền thông tin và lưu

2. **Upload Tài Khoản**
   - Vào "Cài đặt"
   - Chọn sản phẩm
   - Paste danh sách tài khoản (format: email:password)
   - Click "Upload tài khoản"

3. **Quản Lý Đơn Hàng**
   - Vào "Đơn hàng"
   - Xem danh sách và cập nhật trạng thái
   - Tài khoản đã được giao tự động

4. **Bật Chế Độ Bảo Trì**
   - Vào "Cài đặt"
   - Toggle "Chế độ bảo trì"
   - Nhập thông báo và lưu

### Cho Khách Hàng

1. **Mua Sản Phẩm**
   - Duyệt sản phẩm
   - Click "Thêm vào giỏ"
   - Vào giỏ hàng và thanh toán
   - Nhận tài khoản ngay sau thanh toán

2. **Xem Đơn Hàng**
   - Đăng nhập
   - Vào Profile → "Đơn hàng của tôi"
   - Xem chi tiết và tài khoản đã mua

## 🚀 Deployment

### Heroku
```bash
heroku create hanghoammo
git push heroku main
heroku config:set MONGODB_URI=<your_mongodb_uri>
heroku config:set JWT_SECRET=<your_secret>
```

### Vercel/Netlify
- Deploy frontend (public folder)
- Deploy backend riêng hoặc dùng serverless

### VPS
```bash
# Clone code
git clone <repo>
cd hanghoammo

# Install dependencies
npm install

# Setup PM2
npm install -g pm2
pm2 start server.js --name hanghoammo
pm2 save
pm2 startup
```

## 📞 Hỗ Trợ

- Email: support@hanghoammo.com
- Telegram: https://t.me/hanghoammo
- Website: https://hanghoammo.com

## 📄 License

Copyright © 2024 HangHoaMMO. All rights reserved.
