-- Đồng bộ stock_count trên bảng products = số tài khoản available thực tế
-- Chạy 1 lần để sync dữ liệu hiện có

-- 1. Thêm cột stock_count nếu chưa có
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0;

-- 2. Sync stock_count = số accounts available hiện tại
UPDATE products p
SET stock_count = (
    SELECT COUNT(*) FROM accounts a
    WHERE a.product_id = p.id AND a.status = 'available'
);

-- 3. Trigger tự động cập nhật stock_count khi accounts thay đổi
CREATE OR REPLACE FUNCTION sync_product_stock_count()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
BEGIN
    -- Lấy product_id từ row bị thay đổi
    IF TG_OP = 'DELETE' THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    -- Cập nhật stock_count
    UPDATE products
    SET stock_count = (
        SELECT COUNT(*) FROM accounts
        WHERE product_id = target_product_id AND status = 'available'
    )
    WHERE id = target_product_id;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_stock_count ON accounts;
CREATE TRIGGER trigger_sync_stock_count
AFTER INSERT OR UPDATE OF status OR DELETE ON accounts
FOR EACH ROW EXECUTE FUNCTION sync_product_stock_count();
