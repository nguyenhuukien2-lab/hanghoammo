# 🧪 TEST API SUPABASE

## ✅ Server đang chạy!

Server đã khởi động thành công trên port 3001.

---

## 📝 TEST CÁC API

### 1. Health Check
```bash
http://localhost:3001/api/health
```

### 2. Lấy danh sách sản phẩm
```bash
http://localhost:3001/api/products
```

### 3. Đăng ký tài khoản mới
```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "name": "Nguyen Van A",
  "email": "test@example.com",
  "phone": "0909123456",
  "password": "Test@123"
}
```

### 4. Đăng nhập
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123"
}
```

---

## 🌐 MỞ TRÌNH DUYỆT

1. Mở trình duyệt
2. Vào: http://localhost:3001
3. Trang chủ sẽ hiển thị
4. Thử đăng ký/đăng nhập

---

## 🎯 TIẾP THEO

Bây giờ tôi sẽ:
1. ✅ Tích hợp frontend với API mới
2. ✅ Tạo trang ví tiền
3. ✅ Tạo trang nạp tiền
4. ✅ Mua hàng tự động

**Bạn đã mở được http://localhost:3001 chưa?**
