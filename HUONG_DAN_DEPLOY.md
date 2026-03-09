# 🚀 HƯỚNG DẪN DEPLOY LÊN RENDER

## ✅ CHUẨN BỊ

Trước khi deploy, đảm bảo:
- ✅ Server chạy tốt trên local (http://localhost:3001)
- ✅ Đã test đăng ký/đăng nhập
- ✅ Đã test nạp tiền
- ✅ Đã test admin duyệt nạp tiền
- ✅ Tất cả tính năng hoạt động

---

## BƯỚC 1: COMMIT CODE LÊN GITHUB

### 1.1. Kiểm tra file .gitignore
Đảm bảo file `.gitignore` có nội dung:
```
node_modules/
.env
*.log
.DS_Store
```

### 1.2. Commit code
```bash
# Kiểm tra status
git status

# Add tất cả file
git add .

# Commit với message rõ ràng
git commit -m "feat: integrate Supabase backend + wallet system + admin deposit management

- Connect frontend to Supabase API
- Add wallet page with deposit functionality
- Add admin deposit approval system
- Update authentication to use JWT
- Add wallet balance display on header"

# Push lên GitHub
git push origin main
```

### 1.3. Kiểm tra GitHub
- Vào https://github.com/your-username/hanghoammo
- Xem commit mới nhất
- Đảm bảo tất cả file đã được push

---

## BƯỚC 2: CẬP NHẬT ENVIRONMENT VARIABLES TRÊN RENDER

### 2.1. Đăng nhập Render
- Vào https://dashboard.render.com
- Đăng nhập tài khoản

### 2.2. Chọn service
- Click vào service "hanghoammo"
- Hoặc service name bạn đã tạo

### 2.3. Thêm Environment Variables
- Click tab "Environment"
- Click "Add Environment Variable"
- Thêm từng biến sau:

```
SUPABASE_URL
https://wjqahsmislryiuqfmyux.supabase.co

SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcWFoc21pc2xyeWl1cWZteXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzk2MzgsImV4cCI6MjA4ODU1NTYzOH0.lmWlhC_iyfkS9brC23G_dulQhaC56YCTQtQfg93YGDk

JWT_SECRET
hanghoammo_secret_key_2025_very_secure_random_string_change_in_production

JWT_EXPIRE
7d

NODE_ENV
production

PORT
3001
```

### 2.4. Save Changes
- Click "Save Changes"
- Render sẽ tự động restart service

---

## BƯỚC 3: KIỂM TRA BUILD SETTINGS

### 3.1. Vào tab "Settings"
Đảm bảo các setting đúng:

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

hoặc

```
node server-supabase.js
```

### 3.2. Kiểm tra package.json
File `package.json` phải có:
```json
{
  "scripts": {
    "start": "node server-supabase.js",
    "dev": "nodemon server-supabase.js"
  }
}
```

---

## BƯỚC 4: DEPLOY

### 4.1. Manual Deploy (Nếu cần)
- Vào tab "Manual Deploy"
- Click "Deploy latest commit"
- Hoặc chọn branch cụ thể

### 4.2. Auto Deploy (Khuyến nghị)
- Render tự động deploy khi có commit mới trên GitHub
- Không cần làm gì thêm

### 4.3. Theo dõi Deploy Log
- Vào tab "Logs"
- Xem quá trình deploy
- Đợi đến khi thấy:
```
╔═══════════════════════════════════════╗
║   🚀 HANGHOAMMO SERVER STARTED       ║
╠═══════════════════════════════════════╣
║   Port: 3001                        ║
║   Environment: production           ║
║   Database: Supabase PostgreSQL       ║
╚═══════════════════════════════════════╝
```

---

## BƯỚC 5: TEST PRODUCTION

### 5.1. Truy cập website
```
https://hanghoammo.onrender.com
```

### 5.2. Test đăng ký
1. Click "Đăng ký"
2. Điền form
3. Submit
4. ✅ Kiểm tra Supabase → Thấy user mới

### 5.3. Test đăng nhập
1. Đăng nhập với tài khoản vừa tạo
2. ✅ Thấy tên user + số dư ví

### 5.4. Test nạp tiền
1. Vào trang ví: https://hanghoammo.onrender.com/wallet.html
2. Click "Nạp tiền"
3. Điền form và submit
4. ✅ Kiểm tra Supabase → Thấy deposit request

### 5.5. Test admin
1. Đăng nhập admin: admin@hanghoammo.com / Admin@123
2. Vào: https://hanghoammo.onrender.com/admin
3. Click tab "Nạp tiền"
4. Duyệt yêu cầu nạp tiền
5. ✅ Kiểm tra Supabase → Wallet balance tăng

---

## 🐛 XỬ LÝ LỖI

### Lỗi 1: Build failed
**Nguyên nhân:** Thiếu dependencies
**Giải pháp:**
```bash
# Kiểm tra package.json có đầy đủ dependencies
npm install
npm run dev  # Test local trước
```

### Lỗi 2: Server không start
**Nguyên nhân:** Environment variables chưa đúng
**Giải pháp:**
- Kiểm tra lại tất cả env variables trên Render
- Đảm bảo SUPABASE_URL và SUPABASE_ANON_KEY đúng

### Lỗi 3: API không hoạt động
**Nguyên nhân:** CORS hoặc JWT secret sai
**Giải pháp:**
- Kiểm tra server-supabase.js có `app.use(cors())`
- Kiểm tra JWT_SECRET trên Render

### Lỗi 4: Database connection failed
**Nguyên nhân:** Supabase credentials sai
**Giải pháp:**
- Vào Supabase Dashboard
- Copy lại SUPABASE_URL và SUPABASE_ANON_KEY
- Update trên Render

### Lỗi 5: 404 Not Found
**Nguyên nhân:** Routes không đúng
**Giải pháp:**
- Kiểm tra server-supabase.js có serve static files
- Đảm bảo có: `app.use(express.static('public'))`

---

## 📊 MONITORING

### Kiểm tra logs
```
Render Dashboard → Service → Logs
```

### Kiểm tra metrics
```
Render Dashboard → Service → Metrics
```

### Kiểm tra database
```
Supabase Dashboard → Table Editor
```

---

## 🔒 BẢO MẬT

### Sau khi deploy, nên:

1. **Đổi JWT_SECRET:**
```bash
# Tạo secret mới
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update trên Render
```

2. **Đổi admin password:**
- Đăng nhập admin
- Vào Settings
- Đổi mật khẩu

3. **Enable HTTPS:**
- Render tự động enable HTTPS
- Không cần config thêm

4. **Backup database:**
- Supabase tự động backup
- Hoặc export manual từ Supabase Dashboard

---

## ✅ CHECKLIST DEPLOY

- [ ] Code đã commit lên GitHub
- [ ] Environment variables đã thêm trên Render
- [ ] Build settings đã đúng
- [ ] Deploy thành công
- [ ] Website truy cập được
- [ ] Đăng ký hoạt động
- [ ] Đăng nhập hoạt động
- [ ] Nạp tiền hoạt động
- [ ] Admin duyệt nạp tiền hoạt động
- [ ] Data lưu vào Supabase
- [ ] Đã đổi JWT_SECRET
- [ ] Đã đổi admin password

---

## 🎉 HOÀN THÀNH!

Website của bạn đã live tại:
```
https://hanghoammo.onrender.com
```

Admin panel:
```
https://hanghoammo.onrender.com/admin
```

Wallet page:
```
https://hanghoammo.onrender.com/wallet.html
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra logs trên Render
2. Kiểm tra Supabase connection
3. Test lại trên local
4. Hỏi tôi nếu cần hỗ trợ

**Chúc mừng bạn đã deploy thành công! 🚀**
