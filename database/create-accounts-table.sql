-- Create accounts table for selling accounts
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold')),
    sold_at TIMESTAMP,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_product_id ON accounts(product_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_order_id ON accounts(order_id);

-- Add RLS policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on accounts"
ON accounts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Users can only view their purchased accounts
CREATE POLICY "Users can view their purchased accounts"
ON accounts FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT id FROM orders
        WHERE user_id = auth.uid()
    )
);
