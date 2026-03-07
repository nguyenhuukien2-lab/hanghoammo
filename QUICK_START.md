# 🚀 Quick Start Guide - HangHoaMMO

## ✅ Hệ Thống Đã Hoàn Thành

Chúc mừng! Hệ thống shop MMO của bạn đã hoàn thiện với đầy đủ tính năng:

### 🎯 Tính Năng Đã Triển Khai

#### Frontend (Giao Diện)
- ✅ Trang chủ với hero banner và sản phẩm nổi bật
- ✅ Trang sản phẩm với bộ lọc và tìm kiếm
- ✅ Chi tiết sản phẩm với mô tả tự động
- ✅ Giỏ hàng real-time
- ✅ Thanh toán 3 bước với kiểm tra số dư
- ✅ Profile người dùng đầy đủ
- ✅ Admin dashboard chuyên nghiệp
- ✅ Dark mode
- ✅ Responsive design
- ✅ SEO optimization

#### Backend (API)
- ✅ Authentication (đăng ký/đăng nhập)
- ✅ Product management
- ✅ Order management
- ✅ Account management (tự động giao hàng)
- ✅ Payment processing
- ✅ Security (Helmet, Rate Limiting)

#### Tính Năng Đặc Biệt
- ✅ **Tự động giao tài khoản** sau khi thanh toán
- ✅ Upload tài khoản hàng loạt
- ✅ Kiểm tra tồn kho tài khoản
- ✅ Banner bảo trì
- ✅ Tích hợp Telegram
- ✅ Quản lý thông báo

## 🏃 Chạy Ứng Dụng

### Server đang chạy tại:
```
http://localhost:3000
```

### Nếu cần khởi động lại:
```bash
npm start
```

Hoặc trên Windows:
```bash
./start.bat
```

## 📍 Các Trang Quan Trọng

### Khách Hàng
- **Trang chủ**: http://localhost:3000
- **Sản phẩm**: http://localhost:3000/products.html
- **Blog**: http://localhost:3000/blog.html
- **Profile**: http://localhost:3000/profile.html
- **Thanh toán**: http://localhost:3000/checkout.html

### Admin
- **Dashboard**: http://localhost:3000/admin.html

## 🎓 Hướng Dẫn Sử Dụng Nhanh

### 1. Upload Tài Khoản Sản Phẩm (QUAN TRỌNG!)

Để hệ thống tự động giao hàng, bạn cần upload tài khoản:

1. Mở http://localhost:3000/admin.html
2. Click "Cài đặt" ở sidebar
3. Cuộn xuống "Quản lý tài khoản sản phẩm"
4. Chọn sản phẩm từ dropdown
5. Nhập danh sách tài khoản theo format:
   ```
   email1@example.com:password123
   email2@example.com:password456
   username123:mypassword
   ```
6. Click "Upload tài khoản"
7. Click "Kiểm tra tồn kho" để xem số lượng

### 2. Test Quy Trình Mua Hàng

1. Mở trang chủ: http://localhost:3000
2. Chọn sản phẩm và "Thêm vào giỏ"
3. Click icon giỏ hàng ở header
4. Click "Thanh toán"
5. Điền thông tin và chọn phương thức thanh toán
6. Click "Tiếp tục" → "Thanh toán"
7. **Xem tài khoản được giao tự động!**

### 3. Quản Lý Sản Phẩm

#### Thêm Sản Phẩm Mới
1. Vào Admin → Sản phẩm
2. Click "Thêm sản phẩm"
3. Điền thông tin:
   - Tên sản phẩm
   - Danh mục (ai, design, entertainment, software, vpn, service)
   - Giá
   - Link hình ảnh
   - Badge (HOT, NEW, SALE, VIP)
4. Click "Lưu"

#### Sửa/Xóa Sản Phẩm
- Click icon ✏️ để sửa
- Click icon 🗑️ để xóa

### 4. Quản Lý Đơn Hàng

1. Vào Admin → Đơn hàng
2. Xem danh sách đơn hàng
3. Click ✓ để đánh dấu hoàn thành
4. Click ✗ để hủy đơn

### 5. Bật Chế Độ Bảo Trì

1. Vào Admin → Cài đặt
2. Toggle "Chế độ bảo trì"
3. Nhập thông báo bảo trì
4. Click "Lưu thông báo"
5. Banner sẽ hiện trên tất cả trang

### 6. Cấu Hình Telegram

1. Vào Admin → Cài đặt
2. Tìm "Link Telegram"
3. Nhập link kênh Telegram của bạn
4. Click "Lưu thông tin"
5. Modal Telegram sẽ dùng link này

## 🔑 Tài Khoản Mẫu

### Admin (Tạo trong localStorage)
Hiện tại dùng localStorage, không cần đăng nhập admin.

### User Test
Bạn có thể đăng ký tài khoản mới từ trang chủ.

## 📊 Dữ Liệu Mẫu

Hệ thống đã có 24 sản phẩm mẫu:
- ChatGPT Pro
- CapCut Pro
- Canva Education
- Netflix Premium
- Spotify Premium
- Microsoft Office 365
- Và nhiều hơn nữa...

## 🎨 Tùy Chỉnh

### Thay Đổi Màu Sắc
Chỉnh sửa trong `public/style.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
}
```

### Thay Đổi Logo
Chỉnh sửa trong các file HTML:
```html
<span>HangHoa<strong>MMO</strong></span>
```

### Thêm Danh Mục Mới
Chỉnh sửa trong `public/admin.js`:
```javascript
const categories = {
    'ai': 'AI',
    'design': 'Design',
    'your_category': 'Your Category Name'
};
```

## 🐛 Xử Lý Lỗi Thường Gặp

### Port 3000 đã được sử dụng
```bash
# Tìm process
netstat -ano | findstr :3000

# Kill process
taskkill /F /PID <PID>

# Hoặc đổi port trong .env
PORT=3001
```

### Sản phẩm không hiển thị
1. Mở Console (F12)
2. Xem có lỗi không
3. Reload trang (Ctrl+R)
4. Xóa localStorage và reload

### Tài khoản không được giao
1. Kiểm tra đã upload tài khoản chưa
2. Vào Admin → Cài đặt → Kiểm tra tồn kho
3. Xem Console có lỗi không

## 📈 Monitoring

### Kiểm Tra Tồn Kho Tài Khoản
1. Vào Admin → Cài đặt
2. Chọn sản phẩm
3. Click "Kiểm tra tồn kho"
4. Xem số lượng Available/Sold

### Xem Đơn Hàng
1. Vào Admin → Đơn hàng
2. Xem trạng thái và chi tiết
3. Lọc theo trạng thái

### Thống Kê
1. Vào Admin → Dashboard
2. Xem:
   - Tổng sản phẩm
   - Tổng đơn hàng
   - Tổng khách hàng
   - Doanh thu

## 🚀 Triển Khai Production

### Chuẩn Bị
1. Đổi MongoDB URI trong .env
2. Đổi JWT_SECRET
3. Set NODE_ENV=production
4. Cấu hình domain

### Deploy lên VPS
```bash
# Clone code
git clone <your-repo>
cd hanghoammo

# Install
npm install --production

# Setup PM2
npm install -g pm2
pm2 start server.js --name hanghoammo
pm2 save
pm2 startup
```

### Deploy lên Heroku
```bash
heroku create hanghoammo
git push heroku main
heroku config:set MONGODB_URI=<uri>
heroku config:set JWT_SECRET=<secret>
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra Console (F12)
2. Xem file SYSTEM_DOCUMENTATION.md
3. Kiểm tra server logs
4. Xóa localStorage và thử lại

## ✨ Tính Năng Nổi Bật

### 1. Tự Động Giao Tài Khoản
- Upload tài khoản hàng loạt
- Tự động gán khi thanh toán
- Hiển thị ngay cho khách
- Đánh dấu đã bán

### 2. Admin Dashboard
- Quản lý toàn diện
- Thống kê real-time
- Dark mode
- Responsive

### 3. User Experience
- Tìm kiếm thông minh
- Giỏ hàng real-time
- Thanh toán nhanh
- Profile đầy đủ

### 4. Security
- Rate limiting
- Helmet protection
- JWT authentication
- Password hashing

## 🎉 Hoàn Thành!

Hệ thống của bạn đã sẵn sàng! Bắt đầu bằng cách:

1. ✅ Upload tài khoản cho sản phẩm
2. ✅ Test quy trình mua hàng
3. ✅ Tùy chỉnh giao diện
4. ✅ Cấu hình Telegram
5. ✅ Deploy lên production

**Chúc bạn kinh doanh thành công! 🚀**
