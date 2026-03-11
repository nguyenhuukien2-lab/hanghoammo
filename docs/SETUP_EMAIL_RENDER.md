# Cấu hình Email trên Render - HƯỚNG DẪN CHI TIẾT

## ⚠️ QUAN TRỌNG: Phải làm bước này thì email mới hoạt động trên production!

## Bước 1: Vào Render Dashboard

1. Mở trình duyệt, vào: https://dashboard.render.com
2. Đăng nhập tài khoản Render của bạn
3. Tìm và click vào service: **hanghoammo**

## Bước 2: Thêm Environment Variables

1. Trong trang service hanghoammo, click tab **"Environment"** (bên trái)
2. Kéo xuống phần **"Environment Variables"**
3. Click nút **"Add Environment Variable"**

### Thêm biến thứ 1:
- Key: `BREVO_SMTP_USER`
- Value: `a46888001@smtp-brevo.com`
- Click **"Add"**

### Thêm biến thứ 2:
- Click **"Add Environment Variable"** lần nữa
- Key: `BREVO_SMTP_KEY`
- Value: `xsmtpsib-...` (lấy từ file .env local của bạn)
- Click **"Add"**

4. Click nút **"Save Changes"** ở cuối trang

## Bước 3: Chờ Deploy

- Render sẽ tự động deploy lại (mất khoảng 2-3 phút)
- Xem log để kiểm tra deploy thành công

## Bước 4: Test Email

### Cách 1: Đăng ký tài khoản mới
1. Vào: https://hanghoammo.onrender.com
2. Đăng ký tài khoản mới với email của bạn
3. Kiểm tra hộp thư (cả spam/junk)

### Cách 2: Đặt hàng
1. Đăng nhập
2. Nạp tiền vào ví
3. Mua sản phẩm
4. Kiểm tra email xác nhận đơn hàng

### Cách 3: Kiểm tra log trên Render
1. Vào tab **"Logs"**
2. Tìm dòng: `✅ Email sent successfully`

## Kiểm tra email đã nhận

Email sẽ gửi đến: **huukiennguyen711@gmail.com**

⚠️ **LƯU Ý**: Kiểm tra cả thư mục **SPAM/JUNK** trong Gmail!

## Email sẽ được gửi khi:

✅ Khách hàng đăng ký tài khoản mới → Email chào mừng
✅ Khách hàng đặt hàng thành công → Email xác nhận + tài khoản game  
✅ Admin duyệt yêu cầu nạp tiền → Email thông báo nạp tiền thành công

## Thông tin kỹ thuật

- Email gửi từ: **noreply@hanghoammo.com**
- SMTP Server: smtp-relay.brevo.com
- Port: 587
- Brevo free plan: **300 emails/ngày**

## Nếu vẫn không nhận được email

1. Kiểm tra lại Environment Variables trên Render
2. Xem Logs trên Render có lỗi gì không
3. Kiểm tra thư mục Spam/Junk
4. Đợi 5-10 phút (đôi khi email bị delay)
