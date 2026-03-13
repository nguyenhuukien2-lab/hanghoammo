-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- percentage, fixed
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2), -- Max discount for percentage type
    usage_limit INTEGER, -- NULL = unlimited
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, expired
    applicable_products UUID[], -- NULL = all products
    applicable_categories TEXT[], -- NULL = all categories
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_dates ON vouchers(start_date, end_date);

-- Create voucher_usage table
CREATE TABLE IF NOT EXISTS voucher_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(voucher_id, order_id)
);

-- Create indexes
CREATE INDEX idx_voucher_usage_voucher_id ON voucher_usage(voucher_id);
CREATE INDEX idx_voucher_usage_user_id ON voucher_usage(user_id);
CREATE INDEX idx_voucher_usage_order_id ON voucher_usage(order_id);

-- Add voucher fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Function to update voucher used count
CREATE OR REPLACE FUNCTION update_voucher_used_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vouchers
    SET used_count = used_count + 1
    WHERE id = NEW.voucher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update voucher used count
CREATE TRIGGER trigger_update_voucher_used_count
AFTER INSERT ON voucher_usage
FOR EACH ROW
EXECUTE FUNCTION update_voucher_used_count();

-- Function to check and update voucher status
CREATE OR REPLACE FUNCTION check_voucher_status()
RETURNS void AS $$
BEGIN
    UPDATE vouchers
    SET status = 'expired'
    WHERE status = 'active' 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;
