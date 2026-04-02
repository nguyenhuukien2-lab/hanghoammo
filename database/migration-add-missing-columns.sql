-- =============================================
-- MIGRATION: Thêm các columns còn thiếu vào users table
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- Thêm columns vào users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier VARCHAR(50) DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) DEFAULT 0;

-- Thêm columns vào orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Sync total_amount = total nếu chưa có
UPDATE orders SET total_amount = total WHERE total_amount IS NULL;

-- Thêm columns vào deposit_requests
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(255);

-- Thêm columns vào products
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS section VARCHAR(50);

-- Thêm columns vào accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tạo bảng password_reset_otps nếu chưa có
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng tier_config nếu chưa có
CREATE TABLE IF NOT EXISTS tier_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    min_spent DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    can_use_api BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert tier mặc định nếu chưa có
INSERT INTO tier_config (tier_name, min_spent, discount_percent, can_use_api) VALUES
('bronze', 0, 0, false),
('silver', 500000, 3, false),
('gold', 2000000, 5, false),
('platinum', 5000000, 8, false),
('reseller', 10000000, 10, true),
('agency', 50000000, 15, true)
ON CONFLICT (tier_name) DO NOTHING;

-- Tạo bảng tier_upgrade_history nếu chưa có
CREATE TABLE IF NOT EXISTS tier_upgrade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    old_tier VARCHAR(50),
    new_tier VARCHAR(50),
    total_spent_at_upgrade DECIMAL(15,2),
    upgraded_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng messages (chat) nếu chưa có
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL, -- 'user' hoặc 'admin'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng ai_conversations nếu chưa có
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    messages JSONB DEFAULT '[]',
    last_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng vouchers nếu chưa có
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percent', -- 'percent' hoặc 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng voucher_usage nếu chưa có
CREATE TABLE IF NOT EXISTS voucher_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES vouchers(id),
    user_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    discount_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng analytics_events nếu chưa có
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50),
    user_id UUID,
    session_id VARCHAR(255),
    page_url TEXT,
    page_title VARCHAR(255),
    referrer TEXT,
    product_id UUID,
    order_id UUID,
    event_data JSONB,
    user_agent TEXT,
    ip_address VARCHAR(50),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng wishlist nếu chưa có
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Tạo bảng reviews nếu chưa có
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    helpful_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng affiliates nếu chưa có
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_earnings DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng affiliate_commissions nếu chưa có
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES affiliates(id),
    referral_id UUID,
    order_id UUID REFERENCES orders(id),
    order_amount DECIMAL(15,2),
    commission_amount DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng referrals nếu chưa có
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id),
    referred_id UUID REFERENCES users(id),
    referred_user_id UUID REFERENCES users(id),
    affiliate_id UUID REFERENCES affiliates(id),
    referral_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng api_keys nếu chưa có
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    api_key VARCHAR(100) UNIQUE NOT NULL,
    api_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    calls_today INTEGER DEFAULT 0,
    last_call_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng flash_sales nếu chưa có
CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    original_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    max_quantity INTEGER,
    sold_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng product_previews nếu chưa có
CREATE TABLE IF NOT EXISTS product_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    preview_type VARCHAR(20) DEFAULT 'screenshot',
    preview_url TEXT NOT NULL,
    preview_title VARCHAR(255),
    preview_description TEXT,
    is_blurred BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng blog_posts nếu chưa có
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content TEXT,
    excerpt TEXT,
    author_id UUID REFERENCES users(id),
    category_id UUID,
    status VARCHAR(20) DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng blog_comments nếu chưa có
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES blog_comments(id),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng blog_categories nếu chưa có
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng blog_tags nếu chưa có
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng blog_post_tags nếu chưa có
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Tạo bảng blog_likes nếu chưa có
CREATE TABLE IF NOT EXISTS blog_likes (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

-- Tạo bảng affiliate_withdrawals nếu chưa có
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES affiliates(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_info TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- RPC Function: claim_account (atomic)
-- =============================================
CREATE OR REPLACE FUNCTION claim_account(p_product_id UUID)
RETURNS TABLE (
    id UUID, product_id UUID, username VARCHAR, password VARCHAR,
    status VARCHAR, created_at TIMESTAMP, sold_at TIMESTAMP, sold_to UUID
)
LANGUAGE plpgsql AS $$
DECLARE v_account_id UUID;
BEGIN
    SELECT a.id INTO v_account_id
    FROM accounts a
    WHERE a.product_id = p_product_id AND a.status = 'available'
    ORDER BY a.created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;

    IF v_account_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    UPDATE accounts SET status = 'sold', sold_at = NOW()
    WHERE accounts.id = v_account_id
    RETURNING accounts.id, accounts.product_id, accounts.username,
              accounts.password, accounts.status, accounts.created_at,
              accounts.sold_at, accounts.sold_to;

    UPDATE products SET stock_count = (
        SELECT COUNT(*) FROM accounts
        WHERE accounts.product_id = p_product_id AND accounts.status = 'available'
    ) WHERE products.id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_account(UUID) TO service_role;

-- =============================================
-- HOÀN THÀNH! Chạy xong kiểm tra lại đăng ký/đăng nhập
-- =============================================
