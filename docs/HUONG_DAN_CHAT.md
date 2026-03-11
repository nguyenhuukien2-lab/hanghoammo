# 💬 Hướng Dẫn Sử Dụng Hệ Thống Chat

## 📋 Tổng Quan

Hệ thống chat cho phép khách hàng trò chuyện trực tiếp với admin để được hỗ trợ nhanh chóng.

---

## 👤 Dành Cho Khách Hàng

### Cách Truy Cập Chat

1. Đăng nhập vào tài khoản
2. Vào trang **Tài khoản** (Profile)
3. Click vào tab **💬 Chat với Admin**

### Gửi Tin Nhắn

1. Nhập tin nhắn vào ô chat
2. Click nút **Gửi** hoặc nhấn **Enter**
3. Tin nhắn sẽ được gửi đến admin ngay lập tức

### Nhận Tin Nhắn

- Tin nhắn từ admin sẽ hiển thị tự động
- Hệ thống tự động làm mới mỗi 5 giây
- Tin nhắn mới sẽ được đánh dấu là đã đọc khi bạn xem

### Lưu Ý

- Tin nhắn được lưu trữ vĩnh viễn
- Bạn có thể xem lại lịch sử chat bất cứ lúc nào
- Admin sẽ phản hồi trong giờ làm việc

---

## 👨‍💼 Dành Cho Admin

### Cách Truy Cập

1. Đăng nhập vào **Admin Panel**
2. Click vào tab **💬 Chat** trên sidebar

### Giao Diện Chat Admin

**Bên trái:** Danh sách hội thoại
- Hiển thị tất cả khách hàng đã nhắn tin
- Số tin nhắn chưa đọc (badge đỏ)
- Tin nhắn cuối cùng
- Thời gian tin nhắn

**Bên phải:** Khung chat
- Hiển thị toàn bộ lịch sử chat với khách hàng
- Tin nhắn của admin: màu tím, bên phải
- Tin nhắn của khách: màu trắng, bên trái

### Trả Lời Khách Hàng

1. Click vào hội thoại trong danh sách bên trái
2. Nhập tin nhắn vào ô chat
3. Click **Gửi** hoặc nhấn **Enter**

### Tính Năng

✅ **Auto-refresh:** Tự động cập nhật mỗi 5 giây
✅ **Unread count:** Hiển thị số tin nhắn chưa đọc
✅ **Mark as read:** Tự động đánh dấu đã đọc khi xem
✅ **Real-time:** Tin nhắn hiển thị ngay lập tức
✅ **History:** Lưu trữ toàn bộ lịch sử chat

### Làm Mới Danh Sách

Click nút **🔄 Làm mới** để cập nhật danh sách hội thoại

---

## 🗄️ Cấu Trúc Database

### Bảng `messages`

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    sender_type VARCHAR(10), -- 'user' hoặc 'admin'
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP
);
```

### Chạy SQL Tạo Bảng

```bash
# Truy cập Supabase Dashboard
# SQL Editor > New Query
# Copy nội dung file create-chat-table.sql
# Run query
```

---

## 🔌 API Endpoints

### Khách Hàng

**GET** `/api/chat/my-messages`
- Lấy tất cả tin nhắn của user hiện tại

**POST** `/api/chat/send`
- Gửi tin nhắn đến admin
- Body: `{ message: "..." }`

**POST** `/api/chat/mark-read`
- Đánh dấu tin nhắn admin đã đọc

**GET** `/api/chat/unread-count`
- Lấy số tin nhắn chưa đọc

### Admin

**GET** `/api/chat/admin/conversations`
- Lấy danh sách tất cả hội thoại

**GET** `/api/chat/admin/messages/:userId`
- Lấy tin nhắn với user cụ thể

**POST** `/api/chat/admin/send`
- Gửi tin nhắn đến user
- Body: `{ user_id: "...", message: "..." }`

**POST** `/api/chat/admin/mark-read/:userId`
- Đánh dấu tin nhắn user đã đọc

---

## 🎨 Giao Diện

### Khách Hàng (Profile Page)

```
┌─────────────────────────────────────┐
│  💬 Chat với Admin                  │
├─────────────────────────────────────┤
│                                     │
│  [Admin] Xin chào! Tôi có thể      │
│          giúp gì cho bạn?          │
│          10:30                      │
│                                     │
│                  Tôi muốn hỏi về   │
│                  sản phẩm [User]   │
│                  10:32             │
│                                     │
├─────────────────────────────────────┤
│  [Nhập tin nhắn...]        [Gửi]   │
└─────────────────────────────────────┘
```

### Admin Panel

```
┌──────────────┬──────────────────────┐
│ Hội thoại    │  Chat với User       │
├──────────────┼──────────────────────┤
│ 👤 Nguyễn A  │  [User] Xin chào    │
│    Xin chào  │         10:30        │
│    2 tin mới │                      │
│              │  Chào bạn! [Admin]  │
│ 👤 Trần B    │         10:31        │
│    Cảm ơn    │                      │
│              ├──────────────────────┤
│ 👤 Lê C      │  [Nhập...]   [Gửi]  │
└──────────────┴──────────────────────┘
```

---

## 🚀 Triển Khai

### 1. Tạo Bảng Database

```bash
# Chạy file SQL
psql -h [SUPABASE_HOST] -U postgres -d postgres -f create-chat-table.sql
```

Hoặc copy nội dung `create-chat-table.sql` vào Supabase SQL Editor

### 2. Kiểm Tra Routes

File `server-supabase.js` đã có:
```javascript
app.use('/api/chat', chatRoutes);
```

### 3. Test Chức Năng

**Khách hàng:**
1. Đăng nhập
2. Vào Profile > Chat
3. Gửi tin nhắn test

**Admin:**
1. Đăng nhập admin
2. Vào Chat tab
3. Xem tin nhắn và trả lời

---

## 🐛 Troubleshooting

### Không thấy tin nhắn

✅ Kiểm tra đã tạo bảng `messages` chưa
✅ Kiểm tra JWT token còn hợp lệ
✅ Xem Console log có lỗi không

### Không gửi được tin nhắn

✅ Kiểm tra kết nối internet
✅ Kiểm tra Supabase URL và Key
✅ Xem Network tab trong DevTools

### Auto-refresh không hoạt động

✅ Kiểm tra đã vào đúng tab Chat chưa
✅ Xem Console có lỗi JavaScript không
✅ Thử refresh trang

---

## 📝 Ghi Chú

- Tin nhắn được mã hóa để tránh XSS
- Auto-refresh chỉ chạy khi đang ở tab Chat
- Tin nhắn cũ không bị xóa
- Admin có thể xem tất cả hội thoại

---

## 🎯 Tính Năng Tương Lai (Có Thể Mở Rộng)

- [ ] Gửi ảnh trong chat
- [ ] Emoji picker
- [ ] Typing indicator (đang nhập...)
- [ ] Push notification
- [ ] File attachment
- [ ] Voice message
- [ ] Video call

---

**Cập nhật:** 10/03/2026
**Phiên bản:** 1.0.0
