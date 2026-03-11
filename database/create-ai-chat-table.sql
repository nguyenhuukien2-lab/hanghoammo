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

-- Thêm comment
COMMENT ON TABLE ai_conversations IS 'Lưu trữ cuộc hội thoại với AI chatbot tư vấn sản phẩm';
COMMENT ON COLUMN ai_conversations.messages IS 'Mảng JSON chứa lịch sử tin nhắn';
COMMENT ON COLUMN ai_conversations.last_message IS 'Tin nhắn cuối cùng để hiển thị preview';
COMMENT ON COLUMN ai_conversations.user_ip IS 'IP của người dùng (không bắt buộc đăng nhập)';
COMMENT ON COLUMN ai_conversations.user_agent IS 'User agent của trình duyệt';