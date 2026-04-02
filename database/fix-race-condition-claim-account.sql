-- =============================================
-- FIX RACE CONDITION: Atomic account claiming
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- Function: claim_account
-- Atomically marks an available account as 'sold' and returns it.
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions under concurrent load.
CREATE OR REPLACE FUNCTION claim_account(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    username VARCHAR,
    password VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP,
    sold_at TIMESTAMP,
    sold_to UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- Select and lock one available account atomically
    SELECT a.id INTO v_account_id
    FROM accounts a
    WHERE a.product_id = p_product_id
      AND a.status = 'available'
    ORDER BY a.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If no account found, return empty
    IF v_account_id IS NULL THEN
        RETURN;
    END IF;

    -- Mark as sold and return the row
    RETURN QUERY
    UPDATE accounts
    SET status = 'sold',
        sold_at = NOW()
    WHERE accounts.id = v_account_id
    RETURNING
        accounts.id,
        accounts.product_id,
        accounts.username,
        accounts.password,
        accounts.status,
        accounts.created_at,
        accounts.sold_at,
        accounts.sold_to;

    -- Update stock_count on products table
    UPDATE products
    SET stock_count = (
        SELECT COUNT(*) FROM accounts
        WHERE accounts.product_id = p_product_id
          AND accounts.status = 'available'
    )
    WHERE products.id = p_product_id;
END;
$$;

-- Grant execute permission to authenticated users (via service role)
GRANT EXECUTE ON FUNCTION claim_account(UUID) TO service_role;
