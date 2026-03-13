-- Create affiliate program table
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Percentage
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_withdrawn DECIMAL(10,2) DEFAULT 0,
    available_balance DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, inactive
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, inactive
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

-- Create indexes
CREATE INDEX idx_referrals_affiliate_id ON referrals(affiliate_id);
CREATE INDEX idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Create affiliate commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX idx_affiliate_commissions_order_id ON affiliate_commissions(order_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);

-- Create affiliate withdrawals table
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_info TEXT, -- Bank account, Momo, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, rejected
    reject_reason TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_affiliate_withdrawals_affiliate_id ON affiliate_withdrawals(affiliate_id);
CREATE INDEX idx_affiliate_withdrawals_status ON affiliate_withdrawals(status);

-- Add referral fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES affiliates(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50);

-- Add referral fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;

-- Function to create commission when order is completed
CREATE OR REPLACE FUNCTION create_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_affiliate_id UUID;
    v_referral_id UUID;
    v_commission_rate DECIMAL(5,2);
    v_commission_amount DECIMAL(10,2);
BEGIN
    -- Only process when order status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get referral info
        SELECT r.affiliate_id, r.id, a.commission_rate
        INTO v_affiliate_id, v_referral_id, v_commission_rate
        FROM referrals r
        JOIN affiliates a ON a.id = r.affiliate_id
        WHERE r.referred_user_id = NEW.user_id
        AND r.status = 'active'
        AND a.status = 'active'
        LIMIT 1;
        
        IF v_affiliate_id IS NOT NULL THEN
            -- Calculate commission
            v_commission_amount := (NEW.total_amount * v_commission_rate) / 100;
            
            -- Create commission record
            INSERT INTO affiliate_commissions (
                affiliate_id,
                referral_id,
                order_id,
                order_amount,
                commission_rate,
                commission_amount,
                status
            ) VALUES (
                v_affiliate_id,
                v_referral_id,
                NEW.id,
                NEW.total_amount,
                v_commission_rate,
                v_commission_amount,
                'approved' -- Auto approve
            );
            
            -- Update affiliate earnings
            UPDATE affiliates
            SET 
                total_earnings = total_earnings + v_commission_amount,
                available_balance = available_balance + v_commission_amount,
                updated_at = NOW()
            WHERE id = v_affiliate_id;
            
            -- Update order with affiliate info
            UPDATE orders
            SET 
                affiliate_id = v_affiliate_id,
                commission_amount = v_commission_amount
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create commission
CREATE TRIGGER trigger_create_affiliate_commission
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_affiliate_commission();

-- Function to update referral count
CREATE OR REPLACE FUNCTION update_affiliate_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE affiliates
    SET total_referrals = total_referrals + 1
    WHERE id = NEW.affiliate_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral count
CREATE TRIGGER trigger_update_affiliate_referral_count
AFTER INSERT ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_referral_count();
