-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX idx_wishlist_created_at ON wishlist(created_at);

-- Add wishlist_count to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS wishlist_count INTEGER DEFAULT 0;

-- Function to update wishlist count
CREATE OR REPLACE FUNCTION update_wishlist_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET wishlist_count = wishlist_count + 1
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products
        SET wishlist_count = GREATEST(wishlist_count - 1, 0)
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wishlist count
CREATE TRIGGER trigger_update_wishlist_count
AFTER INSERT OR DELETE ON wishlist
FOR EACH ROW
EXECUTE FUNCTION update_wishlist_count();
