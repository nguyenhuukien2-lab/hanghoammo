# 🤖 AI Chatbot Tư Vấn Sản Phẩm - Hướng Dẫn Setup

## 📋 Tổng Quan

AI Chatbot được tích hợp vào website HangHoaMMO để:
- ✅ Tư vấn sản phẩm thông minh 24/7
- ✅ Trả lời câu hỏi khách hàng tự động
- ✅ Gợi ý sản phẩm phù hợp
- ✅ Hướng dẫn quy trình mua hàng
- ✅ Hỗ trợ khách hàng không cần đăng nhập

## 🚀 Cách Hoạt Động

```
Khách hàng hỏi → Chatbot gửi lên server → OpenAI API → AI trả lời → Hiển thị cho khách
```

## 📁 Files Đã Tạo

### 1. Backend Routes
- `src/routes/ai-chat.js` - API endpoint cho chatbot
- `database/create-ai-chat-table.sql` - Tạo bảng lưu cuộc hội thoại

### 2. Frontend Files  
- `public/ai-chatbot.css` - Giao diện chatbot
- `public/ai-chatbot.js` - Logic chatbot
- `public/chatbot-demo.html` - Trang demo chatbot

### 3. Integration
- Đã tích hợp vào `index.html` và `products.html`
- Thêm route vào `server-supabase.js`

## ⚙️ Setup Instructions

### Bước 1: Cài Đặt Dependencies
```bash
npm install openai
```

### Bước 2: Tạo Bảng Database
Chạy SQL trong Supabase:
```sql
-- Tạo bảng lưu cuộc hội thoại AI chatbot
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    messages JSONB NOT NULL DEFAULT '[]',
    last_message TEXT,
    user_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_ip ON ai_conversations(user_ip);
```

### Bước 3: Cấu Hình OpenAI API Key
1. Đăng ký tài khoản tại: https://platform.openai.com/
2. Tạo API key tại: https://platform.openai.com/api-keys
3. Thêm vào file `.env`:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Bước 4: Khởi Động Server
```bash
npm start
```

## 🎯 Cách Sử Dụng

### 1. Trên Website
- Chatbot xuất hiện ở góc phải màn hình
- Click vào icon 🤖 để mở chat
- Gõ câu hỏi và nhận phản hồi từ AI

### 2. Demo Page
- Truy cập: `http://localhost:3001/chatbot-demo.html`
- Thử các câu hỏi mẫu
- Test tính năng chatbot

### 3. API Endpoints
```javascript
// Gửi tin nhắn
POST /api/ai-chat/message
{
  "message": "Tôi muốn tìm tài khoản Netflix",
  "conversation_id": "uuid-optional"
}

// Lấy lịch sử hội thoại
GET /api/ai-chat/conversation/:id
```

## 🎨 Tùy Chỉnh

### 1. Thay Đổi Giao Diện
Chỉnh sửa file `public/ai-chatbot.css`:
- Màu sắc chatbot
- Kích thước cửa sổ chat
- Vị trí hiển thị

### 2. Cập Nhật AI Prompt
Trong `src/routes/ai-chat.js`, chỉnh sửa `systemPrompt`:
```javascript
const systemPrompt = `Bạn là AI chatbot tư vấn sản phẩm...`;
```

### 3. Thêm Tính Năng
- Tích hợp với hệ thống user
- Lưu lịch sử chat theo user
- Thêm quick actions
- Tích hợp với giỏ hàng

## 🔧 Troubleshooting

### Lỗi OpenAI API
```
Error: OpenAI API key not configured
```
**Giải pháp:** Kiểm tra OPENAI_API_KEY trong file .env

### Chatbot Không Hiển Thị
**Kiểm tra:**
1. File CSS và JS đã được include chưa
2. Console có lỗi JavaScript không
3. Server có chạy không

### AI Trả Lời Không Chính Xác
**Tối ưu:**
1. Cập nhật system prompt
2. Thêm thông tin sản phẩm chi tiết
3. Fine-tune model parameters

## 📊 Monitoring

### 1. Xem Logs
```bash
# Xem logs server
npm start

# Xem logs trong browser console
F12 → Console
```

### 2. Database Analytics
```sql
-- Số lượng cuộc hội thoại
SELECT COUNT(*) FROM ai_conversations;

-- Cuộc hội thoại gần đây
SELECT * FROM ai_conversations 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🚀 Nâng Cấp

### Tính Năng Nâng Cao
1. **Voice Chat** - Thêm nhận diện giọng nói
2. **Image Recognition** - AI nhận diện hình ảnh sản phẩm  
3. **Multilingual** - Hỗ trợ nhiều ngôn ngữ
4. **Analytics** - Thống kê hiệu quả chatbot
5. **Integration** - Kết nối CRM, Email marketing

### Performance Optimization
1. **Caching** - Cache phản hồi phổ biến
2. **Rate Limiting** - Giới hạn request
3. **Load Balancing** - Phân tải cho nhiều user
4. **CDN** - Tối ưu tốc độ tải

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs server và browser
2. Xem file README.md
3. Liên hệ team dev qua Telegram

---

**Lưu ý:** Chatbot sử dụng OpenAI API có tính phí. Theo dõi usage để tránh chi phí bất ngờ.