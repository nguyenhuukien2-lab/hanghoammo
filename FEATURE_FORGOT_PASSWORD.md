# Tính năng: Quên mật khẩu

## Trạng thái: ✅ HOÀN THÀNH

## Mô tả
Khách hàng có thể lấy lại mật khẩu khi quên thông qua 3 bước xác minh.

---

## Quy trình lấy lại mật khẩu

### Bước 1: Nhập Email
- Khách hàng nhập email đã đăng ký
- Hệ thống kiểm tra email có tồn tại không
- Nếu có → chuyển sang bước 2

### Bước 2: Xác minh số điện thoại
- Khách hàng nhập số điện thoại đã đăng ký
- Hệ thống so sánh với số điện thoại trong tài khoản
- Nếu khớp → chuyển sang bước 3

### Bước 3: Đặt mật khẩu mới
- Khách hàng nhập mật khẩu mới
- Kiểm tra độ mạnh mật khẩu (tối thiểu 3/5 yêu cầu)
- Xác nhận mật khẩu mới
- Cập nhật mật khẩu thành công → chuyển về đăng nhập

---

## Tính năng

### Bảo mật
- ✅ Xác minh email tồn tại
- ✅ Xác minh số điện thoại khớp với tài khoản
- ✅ Kiểm tra độ mạnh mật khẩu mới
- ✅ Xác nhận mật khẩu 2 lần

### UI/UX
- ✅ Form 3 bước rõ ràng
- ✅ Hiển thị thanh độ mạnh mật khẩu
- ✅ Thông báo từng bước
- ✅ Nút "Quay lại đăng nhập"
- ✅ Link "Quên mật khẩu?" ở form đăng nhập

### Validation
- ✅ Email phải tồn tại trong hệ thống
- ✅ Số điện thoại phải khớp chính xác
- ✅ Mật khẩu mới phải đạt tối thiểu 3/5 yêu cầu
- ✅ Mật khẩu xác nhận phải khớp

---

## Files đã sửa

### 1. public/index.html
- Thêm tab "Quên mật khẩu" vào auth modal
- Thêm form quên mật khẩu với 3 bước
- Thêm link "Quên mật khẩu?" ở form đăng nhập

### 2. public/script.js
- Thêm handler cho form quên mật khẩu
- Logic 3 bước: email → phone → new password
- Cập nhật hàm `switchAuthTab()` để hỗ trợ tab forgot
- Tích hợp kiểm tra độ mạnh mật khẩu

### 3. public/style.css
- Thêm CSS cho `.auth-form-footer`
- Style cho link "Quên mật khẩu?"

---

## Cách sử dụng

### Cho khách hàng:

1. **Vào trang đăng nhập**
   - Click "Đăng nhập" ở header
   - Hoặc click tab "Quên mật khẩu"

2. **Bước 1: Nhập email**
   - Nhập email đã đăng ký
   - Click "Tiếp tục"

3. **Bước 2: Xác minh SĐT**
   - Nhập số điện thoại đã đăng ký
   - Click "Xác minh"

4. **Bước 3: Đặt mật khẩu mới**
   - Nhập mật khẩu mới (đạt tối thiểu 3/5 yêu cầu)
   - Xác nhận mật khẩu
   - Click "Đặt lại mật khẩu"

5. **Hoàn thành**
   - Thông báo thành công
   - Tự động chuyển về form đăng nhập
   - Đăng nhập với mật khẩu mới

---

## Kiểm tra

### Test Case 1: Email không tồn tại
1. Nhập email chưa đăng ký
2. Click "Tiếp tục"
3. ✅ Hiển thị lỗi: "Email không tồn tại trong hệ thống!"

### Test Case 2: Số điện thoại sai
1. Nhập email đúng
2. Nhập số điện thoại sai
3. Click "Xác minh"
4. ✅ Hiển thị lỗi: "Số điện thoại không khớp với tài khoản!"

### Test Case 3: Mật khẩu yếu
1. Hoàn thành bước 1 và 2
2. Nhập mật khẩu yếu (< 3 yêu cầu)
3. Click "Đặt lại mật khẩu"
4. ✅ Hiển thị lỗi: "Mật khẩu quá yếu!"

### Test Case 4: Thành công
1. Nhập email đúng
2. Nhập SĐT đúng
3. Nhập mật khẩu mạnh
4. Xác nhận mật khẩu
5. ✅ Cập nhật thành công
6. ✅ Chuyển về đăng nhập
7. ✅ Đăng nhập được với mật khẩu mới

---

## Lưu ý

### Bảo mật
- Sử dụng số điện thoại làm phương thức xác minh
- Không gửi mật khẩu qua email (vì không có email server)
- Mật khẩu mới phải đạt chuẩn bảo mật

### Dữ liệu
- Mật khẩu được lưu trong `localStorage.users`
- Cập nhật trực tiếp vào object user
- Không lưu lịch sử mật khẩu cũ

### UX
- Form 3 bước rõ ràng, dễ hiểu
- Thông báo chi tiết từng bước
- Tự động chuyển về đăng nhập sau khi thành công

---

## Hoàn thành
✅ Form quên mật khẩu 3 bước
✅ Xác minh email và số điện thoại
✅ Kiểm tra độ mạnh mật khẩu mới
✅ Cập nhật mật khẩu thành công
✅ UI/UX thân thiện
✅ Validation đầy đủ
