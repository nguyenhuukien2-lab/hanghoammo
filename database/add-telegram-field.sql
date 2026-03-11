-- Thêm trường telegram_chat_id vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);

-- Tạo index cho telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);
