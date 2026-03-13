-- Add voucher support to orders table
ALTER TABLE orders 
ADD COLUMN voucher_id UUID REFERENCES vouchers(id),
ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add index for voucher lookups
CREATE INDEX idx_orders_voucher_id ON orders(voucher_id);

-- Update existing orders to have 0 discount
UPDATE orders SET discount_amount = 0.00 WHERE discount_amount IS NULL;
