# Tính năng: Kiểm tra độ mạnh mật khẩu & Quản lý khách hàng

## Trạng thái: ✅ HOÀN THÀNH

## Mô tả
Đã triển khai 2 tính năng chính:
1. **Kiểm tra độ mạnh mật khẩu** khi đăng ký
2. **Quản lý khách hàng** trong trang admin

---

## 1. Kiểm tra độ mạnh mật khẩu

### Tính năng
- Hiển thị thanh chỉ báo độ mạnh mật khẩu real-time
- Kiểm tra 5 yêu cầu:
  - ✅ Ít nhất 8 ký tự
  - ✅ Chữ hoa (A-Z)
  - ✅ Chữ thường (a-z)
  - ✅ Số (0-9)
  - ✅ Ký tự đặc biệt (!@#$%^&*...)

### Cấp độ mật khẩu
- **Yếu** (1-2 yêu cầu): Màu đỏ
- **Trung bình** (3 yêu cầu): Màu cam
- **Mạnh** (4-5 yêu cầu): Màu xanh

### Validation
- Yêu cầu tối thiểu: **3/5 yêu cầu** để đăng ký thành công
- Hiển thị thông báo lỗi nếu mật khẩu quá yếu

### Files đã sửa
- `public/script.js`: Thêm hàm `checkPasswordStrength()` và `updatePasswordStrength()`
- `public/index.html`: Thêm UI cho password strength indicator
- `public/style.css`: Thêm CSS cho thanh chỉ báo và danh sách yêu cầu

### Cách sử dụng
1. Mở trang đăng ký
2. Nhập mật khẩu vào ô "Mật khẩu"
3. Thanh chỉ báo sẽ hiển thị độ mạnh real-time
4. Danh sách yêu cầu sẽ hiển thị với dấu ✓ cho yêu cầu đã đáp ứng
5. Chỉ có thể đăng ký khi đạt tối thiểu 3/5 yêu cầu

---

## 2. Quản lý khách hàng trong Admin

### Tính năng
- Hiển thị danh sách tất cả khách hàng đã đăng ký
- Thống kê cho mỗi khách hàng:
  - Email
  - Tên
  - Số đơn hàng
  - Tổng chi tiêu
  - Ngày đăng ký
- Tìm kiếm khách hàng theo email, tên, số điện thoại
- Xem chi tiết khách hàng với lịch sử đơn hàng

### Thống kê Dashboard
- Cập nhật số lượng khách hàng trên dashboard
- Hiển thị tổng số khách hàng đã đăng ký

### Files đã sửa
- `public/admin.js`: 
  - Cập nhật `loadCustomers()` để load từ localStorage users
  - Thêm `filterCustomers()` để tìm kiếm
  - Thêm `viewCustomerDetails()` để xem chi tiết
  - Cập nhật `loadDashboard()` để hiển thị số khách hàng
  - Cập nhật `loadOrders()` để sử dụng adminOrders

### Cách sử dụng
1. Đăng nhập vào trang admin (`admin.html`)
2. Click vào menu "Khách hàng"
3. Xem danh sách khách hàng với thống kê
4. Sử dụng ô tìm kiếm để lọc khách hàng
5. Click nút "👁" để xem chi tiết khách hàng và lịch sử đơn hàng

### Dữ liệu
- Khách hàng được lưu trong `localStorage.users`
- Đơn hàng được lưu trong `localStorage.adminOrders`
- Tự động tính toán số đơn và tổng chi tiêu cho mỗi khách hàng

---

## Kiểm tra

### Test Password Strength
1. Mở trang chủ
2. Click "Đăng ký"
3. Thử các mật khẩu:
   - `abc` → Yếu (chỉ chữ thường)
   - `Abc123` → Trung bình (3/5 yêu cầu)
   - `Abc123!@` → Mạnh (5/5 yêu cầu)
4. Thử đăng ký với mật khẩu yếu → Sẽ bị chặn

### Test Customer Management
1. Đăng ký vài tài khoản khách hàng
2. Đặt vài đơn hàng với các tài khoản đó
3. Đăng nhập admin
4. Vào trang "Khách hàng"
5. Kiểm tra:
   - Danh sách khách hàng hiển thị đúng
   - Số đơn hàng và tổng chi tiêu chính xác
   - Tìm kiếm hoạt động
   - Xem chi tiết hiển thị lịch sử đơn hàng

---

## Lưu ý kỹ thuật

### Password Strength
- Sử dụng regex để kiểm tra từng yêu cầu
- Update real-time khi người dùng nhập
- CSS animation mượt mà cho thanh chỉ báo

### Customer Management
- Tính toán thống kê on-the-fly từ orders
- Sắp xếp khách hàng theo tổng chi tiêu (cao → thấp)
- Modal chi tiết khách hàng được tạo động
- Tương thích với cả adminOrders và orders cũ

---

## Hoàn thành
✅ Password strength checker với 5 yêu cầu
✅ Real-time validation và UI feedback
✅ Customer management trong admin panel
✅ Thống kê đơn hàng và chi tiêu cho mỗi khách hàng
✅ Tìm kiếm và xem chi tiết khách hàng
✅ Cập nhật dashboard với số lượng khách hàng
