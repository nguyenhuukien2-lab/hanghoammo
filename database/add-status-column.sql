-- Add status column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing products
UPDATE products 
SET status = 'active' 
WHERE status IS NULL;
