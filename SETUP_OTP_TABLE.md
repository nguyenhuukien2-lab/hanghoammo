# 🔐 Hướng dẫn tạo bảng OTP cho đổi mật khẩu

## Bước 1: Mở Supabase SQL Editor

1. Truy cập: https://supabase.com/dashboard/project/wjqahsmislryiuqfmyux
2. Click vào **SQL Editor** ở menu bên trái
3. Click **New Query**

## Bước 2: Copy và chạy SQL

Copy toàn bộ code bên dưới và paste vào SQL Editor, sau đó click **Run**:

```sql
-- Create password_reset_otps table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_otp ON password_reset_otps(otp);

-- Comment
COMMENT ON TABLE password_reset_otps IS 'Store OTP codes for password reset verification';
```

## Bước 3: Kiểm tra

Sau khi chạy xong, vào **Table Editor** → Kiểm tra có bảng `password_reset_otps` chưa.

## ✅ Hoàn thành!

Bây giờ hệ thống đã sẵn sàng gửi mã OTP khi đổi mật khẩu.

---

## 🔄 Luồng hoạt động:

1. User nhập mật khẩu hiện tại
2. Click "Gửi mã OTP"
3. Hệ thống tạo mã OTP 6 số ngẫu nhiên
4. Lưu OTP vào database (có hiệu lực 5 phút)
5. Gửi OTP qua Email + Telegram
6. User nhập OTP + mật khẩu mới
7. Hệ thống verify OTP
8. Đổi mật khẩu thành công
9. Gửi email xác nhận

---

## 📧 Email sẽ gửi:

1. **Email OTP**: Chứa mã 6 số, có hiệu lực 5 phút
2. **Email xác nhận**: Thông báo mật khẩu đã đổi thành công

## 📱 Telegram sẽ gửi:

1. **Tin nhắn OTP**: Chứa mã 6 số
2. **Tin nhắn xác nhận**: Thông báo mật khẩu đã đổi
