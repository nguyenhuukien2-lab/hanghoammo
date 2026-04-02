-- =============================================
-- 2FA SUPPORT (TOTP)
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- Thêm cột 2FA
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(two_factor_enabled);
