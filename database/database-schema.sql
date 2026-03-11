-- =============================================
-- HANGHOAMMO DATABASE SCHEMA
-- Supabase PostgreSQL
-- =============================================

-- 1. BẢNG USERS (Người dùng)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user', -- 'user' hoặc 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. BẢNG WALLET (Ví tiền)
CREATE TABLE wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. BẢNG PRODUCTS (Sản phẩm)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    badge VARCHAR(20),
    sold INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. BẢNG ACCOUNTS (Tài khoản bán)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'sold'
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP,
    sold_to UUID REFERENCES users(id)
);

-- 5. BẢNG ORDERS (Đơn hàng)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. BẢNG ORDER_ITEMS (Chi tiết đơn hàng)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255),
    product_price DECIMAL(10, 2),
    quantity INTEGER DEFAULT 1,
    account_id UUID REFERENCES accounts(id), -- Tài khoản đã giao
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. BẢNG TRANSACTIONS (Lịch sử giao dịch ví)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'deposit' (nạp), 'withdraw' (rút), 'purchase' (mua hàng)
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2),
    balance_after DECIMAL(10, 2),
    description TEXT,
    order_id UUID REFERENCES orders(id),
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. BẢNG DEPOSIT_REQUESTS (Yêu cầu nạp tiền)
CREATE TABLE deposit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'momo', 'vnpay'
    transaction_code VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    note TEXT,
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES (Tăng tốc truy vấn)
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wallet_user_id ON wallet(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_accounts_product_id ON accounts(product_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_deposit_requests_user_id ON deposit_requests(user_id);
CREATE INDEX idx_deposit_requests_status ON deposit_requests(status);

-- =============================================
-- TRIGGERS (Tự động cập nhật)
-- =============================================

-- Tự động tạo ví khi user đăng ký
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallet (user_id, balance)
    VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_user();

-- Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_wallet_updated_at
BEFORE UPDATE ON wallet
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DỮ LIỆU MẪU (Sample Data)
-- =============================================

-- Admin account (password: Admin@123)
INSERT INTO users (email, password, name, phone, role)
VALUES ('admin@hanghoammo.com', '$2b$10$rKvVLZ8xqJ5YJ5YJ5YJ5YOX8xqJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5Y', 'Admin', '0879062222', 'admin');

-- Sample products
INSERT INTO products (name, category, price, image, badge, sold, description) VALUES
('ChatGPT Pro giá rẻ hơn gốc', 'ai', 40000, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png', 'HOT', 234, 'Tài khoản ChatGPT Pro chính hãng'),
('CapCut Pro giá rẻ tuyệt đối', 'design', 7000, 'https://play-lh.googleusercontent.com/3aWGqSf3T_p3F6wc8FFvcZcnjWlxpZdNaqHVNAqBFXvfRCyXYBiCwC-KXNR5p6LCnA=w240-h480-rw', 'HOT', 125, 'CapCut Pro - Chỉnh sửa video chuyên nghiệp'),
('Canva Education 1 năm BHF', 'design', 8000, 'https://static-00.iconduck.com/assets.00/canva-icon-2048x2048-g0kwfohy.png', 'NEW', 89, 'Canva Education - Thiết kế đồ họa dễ dàng'),
('Netflix Premium 4K - 1 tháng', 'entertainment', 45000, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1920px-Netflix_2015_logo.svg.png', 'SALE', 312, 'Netflix Premium 4K - Xem phim không giới hạn'),
('Spotify Premium', 'entertainment', 35000, 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png', 'HOT', 267, 'Spotify Premium - Nghe nhạc không quảng cáo');

-- =============================================
-- ROW LEVEL SECURITY (Bảo mật)
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;

-- Policies cho users
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies cho wallet
CREATE POLICY "Users can view own wallet" ON wallet FOR SELECT USING (auth.uid() = user_id);

-- Policies cho products (public read)
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Policies cho orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies cho transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Policies cho deposit_requests
CREATE POLICY "Users can view own deposit requests" ON deposit_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposit requests" ON deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- HOÀN THÀNH!
-- =============================================
-- Chạy script này trong Supabase SQL Editor
-- Sau đó kiểm tra bảng đã tạo chưa
