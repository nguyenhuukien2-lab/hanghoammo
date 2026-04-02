-- =============================================
-- EMAIL VERIFICATION
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- Thêm cột email_verified và verification_token
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;

-- Index cho verification token
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Đánh dấu tất cả user hiện tại đã verified (migration)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE;
