-- =====================================================
-- HỆ THỐNG QUẢN LÝ KHO & SỐ LƯỢNG REAL-TIME
-- =====================================================

-- 1. Thêm cột stock vào bảng products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS auto_restock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock'));

-- 2. Tạo bảng stock_history - Lịch sử thay đổi kho
CREATE TABLE IF NOT EXISTS stock_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('restock', 'sold', 'reserved', 'expired', 'manual')),
    quantity_change INTEGER NOT NULL, -- Số lượng thay đổi (âm = giảm, dương = tăng)
    old_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tạo bảng flash_sales - Flash sale/Deal countdown
CREATE TABLE IF NOT EXISTS flash_sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_price DECIMAL(15,2) NOT NULL,
    sale_price DECIMAL(15,2) NOT NULL,
    discount_percent INTEGER GENERATED ALWAYS AS (
        ROUND(((original_price - sale_price) / original_price * 100)::numeric, 0)::integer
    ) STORED,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    max_quantity INTEGER, -- Số lượng tối đa cho flash sale
    sold_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tạo bảng product_previews - Preview ảnh demo tài khoản
CREATE TABLE IF NOT EXISTS product_previews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    preview_type VARCHAR(20) DEFAULT 'screenshot' CHECK (preview_type IN ('screenshot', 'video', 'demo_account')),
    preview_url TEXT NOT NULL,
    preview_title VARCHAR(255),
    preview_description TEXT,
    is_blurred BOOLEAN DEFAULT TRUE, -- Làm mờ để tạo tò mò
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Function cập nhật stock status tự động
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật stock_status dựa trên số lượng
    IF NEW.stock <= 0 THEN
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.stock <= NEW.low_stock_threshold THEN
        NEW.stock_status := 'low_stock';
    ELSE
        NEW.stock_status := 'in_stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger cập nhật stock status
DROP TRIGGER IF EXISTS trigger_update_stock_status ON products;
CREATE TRIGGER trigger_update_stock_status
BEFORE UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION update_stock_status();

-- 7. Function ghi log stock history
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ log khi stock thay đổi
    IF OLD.stock IS DISTINCT FROM NEW.stock THEN
        INSERT INTO stock_history (
            product_id, 
            change_type, 
            quantity_change, 
            old_stock, 
            new_stock,
            reason
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.stock > OLD.stock THEN 'restock'
                WHEN NEW.stock < OLD.stock THEN 'sold'
                ELSE 'manual'
            END,
            NEW.stock - OLD.stock,
            OLD.stock,
            NEW.stock,
            'Auto logged stock change'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger log stock changes
DROP TRIGGER IF EXISTS trigger_log_stock_change ON products;
CREATE TRIGGER trigger_log_stock_change
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION log_stock_change();

-- 9. Function giảm stock khi bán hàng
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Chỉ xử lý khi order completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Giảm stock cho từng sản phẩm trong order
        FOR item IN 
            SELECT product_id, quantity 
            FROM order_items 
            WHERE order_id = NEW.id
        LOOP
            UPDATE products 
            SET stock = GREATEST(0, stock - item.quantity)
            WHERE id = item.product_id;
            
            -- Log stock change
            INSERT INTO stock_history (
                product_id, 
                change_type, 
                quantity_change, 
                old_stock, 
                new_stock,
                reason,
                order_id
            ) 
            SELECT 
                item.product_id,
                'sold',
                -item.quantity,
                stock + item.quantity,
                stock,
                'Sold via order #' || NEW.id,
                NEW.id
            FROM products 
            WHERE id = item.product_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger giảm stock khi bán
DROP TRIGGER IF EXISTS trigger_decrease_stock ON orders;
CREATE TRIGGER trigger_decrease_stock
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION decrease_product_stock();

-- 11. Function check và deactivate flash sales hết hạn
CREATE OR REPLACE FUNCTION deactivate_expired_flash_sales()
RETURNS void AS $$
BEGIN
    UPDATE flash_sales 
    SET is_active = FALSE 
    WHERE end_time < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 12. View để lấy sản phẩm với thông tin stock và flash sale
CREATE OR REPLACE VIEW products_with_stock AS
SELECT 
    p.*,
    CASE 
        WHEN p.stock <= 0 THEN 'Hết hàng'
        WHEN p.stock <= p.low_stock_threshold THEN 'Sắp hết (' || p.stock || ' còn lại)'
        ELSE p.stock || ' có sẵn'
    END as stock_display,
    CASE 
        WHEN p.stock <= 0 THEN 'out-of-stock'
        WHEN p.stock <= p.low_stock_threshold THEN 'low-stock'
        ELSE 'in-stock'
    END as stock_class,
    -- Flash sale info
    fs.id as flash_sale_id,
    fs.title as flash_sale_title,
    fs.sale_price as flash_sale_price,
    fs.discount_percent as flash_sale_discount,
    fs.end_time as flash_sale_end,
    fs.max_quantity as flash_sale_max,
    fs.sold_quantity as flash_sale_sold,
    CASE 
        WHEN fs.is_active AND fs.start_time <= NOW() AND fs.end_time > NOW() 
        THEN TRUE 
        ELSE FALSE 
    END as has_active_flash_sale,
    -- Preview images
    (
        SELECT json_agg(
            json_build_object(
                'id', pp.id,
                'type', pp.preview_type,
                'url', pp.preview_url,
                'title', pp.preview_title,
                'is_blurred', pp.is_blurred
            ) ORDER BY pp.display_order
        )
        FROM product_previews pp 
        WHERE pp.product_id = p.id AND pp.is_active = TRUE
    ) as previews
FROM products p
LEFT JOIN flash_sales fs ON p.id = fs.product_id 
    AND fs.is_active = TRUE 
    AND fs.start_time <= NOW() 
    AND fs.end_time > NOW()
WHERE p.status = 'active';

-- 13. Indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON flash_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_product_previews_product ON product_previews(product_id);

-- 14. Enable Row Level Security
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_previews ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies
-- Stock history: Admin xem tất cả, user không xem
CREATE POLICY "Admins can view all stock history" ON stock_history FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Flash sales: Ai cũng xem được active sales
CREATE POLICY "Anyone can view active flash sales" ON flash_sales FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify flash sales" ON flash_sales FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Product previews: Ai cũng xem được active previews
CREATE POLICY "Anyone can view active previews" ON product_previews FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify previews" ON product_previews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 16. Sample data
-- Cập nhật stock cho sản phẩm hiện có
UPDATE products SET 
    stock = FLOOR(RANDOM() * 50) + 10,  -- Random 10-60
    low_stock_threshold = 5
WHERE stock IS NULL OR stock = 0;

-- Tạo một số flash sales mẫu
INSERT INTO flash_sales (product_id, title, description, original_price, sale_price, start_time, end_time, max_quantity) 
SELECT 
    id,
    'Flash Sale ' || name,
    'Giảm giá sốc chỉ trong thời gian có hạn!',
    price,
    price * 0.7, -- Giảm 30%
    NOW(),
    NOW() + INTERVAL '24 hours',
    20
FROM products 
WHERE id IN (SELECT id FROM products ORDER BY RANDOM() LIMIT 3)
ON CONFLICT DO NOTHING;

-- Tạo preview images mẫu
INSERT INTO product_previews (product_id, preview_type, preview_url, preview_title, is_blurred)
SELECT 
    id,
    'screenshot',
    'https://via.placeholder.com/400x300/667eea/ffffff?text=Preview+' || id,
    'Demo tài khoản ' || name,
    true
FROM products 
WHERE id IN (SELECT id FROM products ORDER BY RANDOM() LIMIT 5)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE stock_history IS 'Lịch sử thay đổi số lượng kho';
COMMENT ON TABLE flash_sales IS 'Flash sales và countdown deals';
COMMENT ON TABLE product_previews IS 'Ảnh preview demo tài khoản';
COMMENT ON VIEW products_with_stock IS 'View sản phẩm với thông tin stock và flash sale';