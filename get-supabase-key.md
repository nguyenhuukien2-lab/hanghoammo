# 🔑 CÁCH LẤY SUPABASE ANON KEY

## Phương pháp 1: Từ Dashboard (Khuyên dùng)

1. Vào: https://supabase.com/dashboard/project/wjqahsmislryiuqfmyux/settings/api

2. Scroll xuống tìm phần **"Project API keys"**

3. Sẽ thấy 2 keys:
   ```
   anon    public    eyJhbGc... [Copy]
   service_role secret eyJhbGc... [Copy]
   ```

4. Click **[Copy]** ở dòng **anon public**

5. Mở file `.env` và thay:
   ```
   SUPABASE_ANON_KEY=eyJhbGc... (paste key vào đây)
   ```

---

## Phương pháp 2: Từ JavaScript Console

1. Vào trang: https://wjqahsmislryiuqfmyux.supabase.co

2. Nhấn **F12** để mở Developer Tools

3. Vào tab **Console**

4. Paste đoạn code này và nhấn Enter:
   ```javascript
   // Lấy anon key từ localStorage
   const keys = JSON.parse(localStorage.getItem('supabase.auth.token'));
   console.log('ANON KEY:', keys);
   
   // Hoặc thử cách này
   const project = JSON.parse(localStorage.getItem('supabase.dashboard.project'));
   console.log('PROJECT:', project);
   ```

5. Copy key hiển thị ra

---

## Phương pháp 3: Từ Network Tab

1. Vào trang: https://wjqahsmislryiuqfmyux.supabase.co

2. Nhấn **F12** → tab **Network**

3. Refresh trang (F5)

4. Tìm request có chứa "supabase"

5. Xem **Headers** → tìm `apikey` hoặc `Authorization`

---

## Phương pháp 4: Tạo key mới (Nếu không tìm được)

1. Vào: https://supabase.com/dashboard/project/wjqahsmislryiuqfmyux/settings/api

2. Scroll xuống phần **Service Keys**

3. Click **Generate new anon key** (nếu có)

4. Copy key mới

---

## ⚠️ LƯU Ý

- **anon key** là public key, có thể share
- **service_role key** là secret key, KHÔNG được share
- Key bắt đầu bằng `eyJ...` và rất dài (khoảng 200+ ký tự)

---

## 🚀 SAU KHI CÓ KEY

1. Mở file `.env`
2. Thay dòng:
   ```
   SUPABASE_ANON_KEY=PLACEHOLDER_KEY_REPLACE_WITH_REAL_KEY
   ```
   Thành:
   ```
   SUPABASE_ANON_KEY=eyJ... (key thật)
   ```
3. Save file
4. Chạy: `node server-supabase.js`

---

## 🆘 NẾU VẪN KHÔNG TÌM ĐƯỢC

Chụp màn hình trang Settings → API và gửi cho tôi, tôi sẽ chỉ chính xác!
