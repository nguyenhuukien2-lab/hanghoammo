-- =====================================================
-- HỆ THỐNG RESELLER/ĐẠI LÝ
-- =====================================================

-- 1. Thêm cột user_tier vào bảng users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_tier VARCHAR(20) DEFAULT 'member' CHECK (user_tier IN ('member', 'vip', 'reseller', 'agency'));

-- 2. Thêm cột total_spent để tracking tổng chi tiêu (tự động lên hạng)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) DEFAULT 0;

-- 3. Tạo bảng tier_config - Cấu hình các cấp bậc
CREATE TABLE IF NOT EXISTS tier_config (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    min_spent DECIMAL(15,2) DEFAULT 0, -- Tổng chi tiêu tối thiểu để đạt cấp
    discount_percent INTEGER DEFAULT 0, -- % giảm giá cho cấp này
    commission_percent INTEGER DEFAULT 0, -- % hoa hồng khi giới thiệu
    can_use_api BOOLEAN DEFAULT FALSE, -- Có thể dùng API không
    max_api_calls INTEGER DEFAULT 0, -- Số lần gọi API/ngày
    priority_support BOOLEAN DEFAULT FALSE, -- Hỗ trợ ưu tiên
    description TEXT,
    benefits JSONB, -- Các quyền lợi khác
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insert dữ liệu mặc định cho tier_config
INSERT INTO tier_config (tier_name, display_name, min_spent, discount_percent, commission_percent, can_use_api, max_api_calls, priority_support, description, benefits) VALUES
('member', 'Thành viên', 0, 0, 0, FALSE, 0, FALSE, 'Cấp độ mặc định cho người dùng mới', '{"features": ["Mua sản phẩm", "Tích điểm"]}'),
('vip', 'VIP', 5000000, 5, 2, FALSE, 0, FALSE, 'Giảm 5% tất cả sản phẩm', '{"features": ["Giảm 5%", "Hoa hồng 2%", "Hỗ trợ nhanh"]}'),
('reseller', 'Reseller', 20000000, 10, 5, TRUE, 100, TRUE, 'Giảm 10%, API tự động lấy hàng', '{"features": ["Giảm 10%", "Hoa hồng 5%", "API 100 calls/ngày", "Hỗ trợ ưu tiên"]}'),
('agency', 'Agency', 50000000, 15, 8, TRUE, 1000, TRUE, 'Giảm 15%, API không giới hạn', '{"features": ["Giảm 15%", "Hoa hồng 8%", "API 1000 calls/ngày", "Hỗ trợ VIP", "Giá sỉ đặc biệt"]}')
ON CONFLICT (tier_name) DO NOTHING;

-- 5. Tạo bảng api_keys - API keys cho reseller/agency
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    api_secret VARCHAR(128) NOT NULL,
    name VARCHAR(100), -- Tên gợi nhớ cho key
    is_active BOOLEAN DEFAULT TRUE,
    calls_today INTEGER DEFAULT 0,
    last_call_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- NULL = không hết hạn
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. Tạo bảng api_logs - Log các lần gọi API
CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time INTEGER, -- milliseconds
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Tạo bảng referrals - Hệ thống giới thiệu
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Người giới thiệu
    referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Người được giới thiệu
    referral_code VARCHAR(20) UNIQUE, -- Mã giới thiệu
    commission_earned DECIMAL(15,2) DEFAULT 0, -- Tổng hoa hồng đã nhận
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Tạo bảng commission_history - Lịch sử hoa hồng
CREATE TABLE IF NOT EXISTS commission_history (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    commission_amount DECIMAL(15,2) NOT NULL,
    commission_percent INTEGER NOT NULL,
    order_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Tạo bảng tier_upgrade_history - Lịch sử nâng cấp
CREATE TABLE IF NOT EXISTS tier_upgrade_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    from_tier VARCHAR(20),
    to_tier VARCHAR(20),
    total_spent DECIMAL(15,2),
    upgraded_at TIMESTAMP DEFAULT NOW()
);

-- 10. Function tự động cập nhật tier khi user chi tiêu
CREATE OR REPLACE FUNCTION auto_upgrade_user_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier VARCHAR(20);
    old_tier VARCHAR(20);
BEGIN
    -- Lấy tier hiện tại
    SELECT user_tier INTO old_tier FROM users WHERE id = NEW.user_id;
    
    -- Xác định tier mới dựa trên total_spent
    SELECT tier_name INTO new_tier
    FROM tier_config
    WHERE NEW.total_spent >= min_spent
    ORDER BY min_spent DESC
    LIMIT 1;
    
    -- Nếu tier thay đổi, cập nhật
    IF new_tier IS NOT NULL AND new_tier != old_tier THEN
        UPDATE users SET user_tier = new_tier WHERE id = NEW.user_id;
        
        -- Ghi log nâng cấp
        INSERT INTO tier_upgrade_history (user_id, from_tier, to_tier, total_spent)
        VALUES (NEW.user_id, old_tier, new_tier, NEW.total_spent);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger tự động nâng cấp tier
DROP TRIGGER IF EXISTS trigger_auto_upgrade_tier ON users;
CREATE TRIGGER trigger_auto_upgrade_tier
AFTER UPDATE OF total_spent ON users
FOR EACH ROW
WHEN (NEW.total_spent > OLD.total_spent)
EXECUTE FUNCTION auto_upgrade_user_tier();

-- 12. Function cập nhật total_spent khi có đơn hàng mới
CREATE OR REPLACE FUNCTION update_user_total_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE users 
        SET total_spent = total_spent + NEW.total_amount
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Trigger cập nhật total_spent
DROP TRIGGER IF EXISTS trigger_update_total_spent ON orders;
CREATE TRIGGER trigger_update_total_spent
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_user_total_spent();

-- 14. Function tính hoa hồng cho referrer
CREATE OR REPLACE FUNCTION calculate_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
    referrer_user_id INTEGER;
    referrer_tier VARCHAR(20);
    commission_rate INTEGER;
    commission_amt DECIMAL(15,2);
BEGIN
    IF NEW.status = 'completed' THEN
        -- Tìm người giới thiệu
        SELECT referrer_id INTO referrer_user_id
        FROM referrals
        WHERE referred_id = NEW.user_id AND status = 'active'
        LIMIT 1;
        
        IF referrer_user_id IS NOT NULL THEN
            -- Lấy tier và commission rate của người giới thiệu
            SELECT u.user_tier, tc.commission_percent 
            INTO referrer_tier, commission_rate
            FROM users u
            JOIN tier_config tc ON u.user_tier = tc.tier_name
            WHERE u.id = referrer_user_id;
            
            -- Tính hoa hồng
            commission_amt := NEW.total_amount * commission_rate / 100;
            
            -- Lưu lịch sử hoa hồng
            INSERT INTO commission_history (referrer_id, referred_id, order_id, commission_amount, commission_percent, order_amount)
            VALUES (referrer_user_id, NEW.user_id, NEW.id, commission_amt, commission_rate, NEW.total_amount);
            
            -- Cộng hoa hồng vào ví
            UPDATE wallet 
            SET balance = balance + commission_amt
            WHERE user_id = referrer_user_id;
            
            -- Cập nhật tổng hoa hồng
            UPDATE referrals
            SET commission_earned = commission_earned + commission_amt
            WHERE referrer_id = referrer_user_id AND referred_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Trigger tính hoa hồng
DROP TRIGGER IF EXISTS trigger_calculate_commission ON orders;
CREATE TRIGGER trigger_calculate_commission
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION calculate_referral_commission();

-- 16. Function reset API calls mỗi ngày (chạy bằng cron job)
CREATE OR REPLACE FUNCTION reset_daily_api_calls()
RETURNS void AS $$
BEGIN
    UPDATE api_keys SET calls_today = 0 WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 17. Indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(user_tier);
CREATE INDEX IF NOT EXISTS idx_users_total_spent ON users(total_spent);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_commission_referrer ON commission_history(referrer_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);

-- 18. Enable Row Level Security
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_upgrade_history ENABLE ROW LEVEL SECURITY;

-- 19. RLS Policies
-- Tier config: Ai cũng đọc được, chỉ admin mới sửa
CREATE POLICY "Anyone can view tier config" ON tier_config FOR SELECT USING (true);
CREATE POLICY "Only admins can modify tier config" ON tier_config FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- API keys: User chỉ thấy key của mình
CREATE POLICY "Users can view own api keys" ON api_keys FOR SELECT USING (auth.uid()::integer = user_id);
CREATE POLICY "Users can create own api keys" ON api_keys FOR INSERT WITH CHECK (auth.uid()::integer = user_id);
CREATE POLICY "Users can update own api keys" ON api_keys FOR UPDATE USING (auth.uid()::integer = user_id);

-- Referrals: User thấy referral của mình
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid()::integer = referrer_id OR auth.uid()::integer = referred_id);

-- Commission history: User thấy hoa hồng của mình
CREATE POLICY "Users can view own commissions" ON commission_history FOR SELECT USING (auth.uid()::integer = referrer_id);

COMMENT ON TABLE tier_config IS 'Cấu hình các cấp bậc user (Member, VIP, Reseller, Agency)';
COMMENT ON TABLE api_keys IS 'API keys cho reseller/agency tự động lấy hàng';
COMMENT ON TABLE api_logs IS 'Log các lần gọi API';
COMMENT ON TABLE referrals IS 'Hệ thống giới thiệu bạn bè';
COMMENT ON TABLE commission_history IS 'Lịch sử hoa hồng từ giới thiệu';
COMMENT ON TABLE tier_upgrade_history IS 'Lịch sử nâng cấp tier';
