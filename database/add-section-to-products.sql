-- Thêm column section vào bảng products
-- Chạy trên Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS section VARCHAR(50) DEFAULT NULL;

-- Giá trị hợp lệ: best_sellers, new_products, hot_products, suggested, NULL (tự động)
COMMENT ON COLUMN products.section IS 'Section hiển thị trên trang chủ: best_sellers, new_products, hot_products, suggested. NULL = tự động phân loại.';
