-- =============================================
-- FLASH SALES TABLE
-- Chạy file này trong Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    stock_limit INTEGER,
    sold_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flash_sales_product_id ON flash_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sales_time ON flash_sales(start_time, end_time);

-- Trigger auto update updated_at
CREATE OR REPLACE FUNCTION update_flash_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_flash_sales_updated_at
    BEFORE UPDATE ON flash_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_flash_sales_updated_at();
