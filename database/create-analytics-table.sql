-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- page_view, product_view, add_to_cart, purchase, etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    page_url TEXT,
    page_title VARCHAR(500),
    referrer TEXT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_data JSONB, -- Additional event data
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(20), -- desktop, mobile, tablet
    browser VARCHAR(50),
    os VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_product_id ON analytics_events(product_id);
CREATE INDEX idx_analytics_events_order_id ON analytics_events(order_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_device_type ON analytics_events(device_type);

-- Create daily stats table (aggregated data)
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0, -- in seconds
    top_products JSONB,
    top_pages JSONB,
    traffic_sources JSONB,
    device_breakdown JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date)
);

-- Create indexes
CREATE INDEX idx_analytics_daily_stats_date ON analytics_daily_stats(date);

-- Create product analytics table
CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, date)
);

-- Create indexes
CREATE INDEX idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX idx_product_analytics_date ON product_analytics(date);

-- Create user behavior table
CREATE TABLE IF NOT EXISTS user_behavior (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_visits INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    last_visit_at TIMESTAMP,
    last_order_at TIMESTAMP,
    favorite_category VARCHAR(100),
    preferred_device VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX idx_user_behavior_last_visit_at ON user_behavior(last_visit_at);

-- Function to update product analytics
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS void AS $$
BEGIN
    -- Update views
    INSERT INTO product_analytics (product_id, date, views, unique_views)
    SELECT 
        product_id,
        DATE(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_views
    FROM analytics_events
    WHERE event_type = 'product_view'
    AND DATE(created_at) = CURRENT_DATE
    AND product_id IS NOT NULL
    GROUP BY product_id, DATE(created_at)
    ON CONFLICT (product_id, date)
    DO UPDATE SET
        views = EXCLUDED.views,
        unique_views = EXCLUDED.unique_views;
    
    -- Update add to cart
    UPDATE product_analytics pa
    SET add_to_cart = (
        SELECT COUNT(*)
        FROM analytics_events ae
        WHERE ae.event_type = 'add_to_cart'
        AND ae.product_id = pa.product_id
        AND DATE(ae.created_at) = pa.date
    )
    WHERE pa.date = CURRENT_DATE;
    
    -- Update purchases and revenue
    UPDATE product_analytics pa
    SET 
        purchases = (
            SELECT COUNT(*)
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.product_id = pa.product_id
            AND DATE(o.created_at) = pa.date
            AND o.status = 'completed'
        ),
        revenue = (
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.product_id = pa.product_id
            AND DATE(o.created_at) = pa.date
            AND o.status = 'completed'
        )
    WHERE pa.date = CURRENT_DATE;
    
    -- Update conversion rate
    UPDATE product_analytics
    SET conversion_rate = CASE 
        WHEN unique_views > 0 THEN (purchases::DECIMAL / unique_views * 100)
        ELSE 0
    END
    WHERE date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO analytics_daily_stats (
        date,
        total_page_views,
        unique_visitors,
        total_sessions,
        total_orders,
        total_revenue
    )
    SELECT
        v_date,
        COUNT(*) FILTER (WHERE event_type = 'page_view'),
        COUNT(DISTINCT user_id),
        COUNT(DISTINCT session_id),
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = v_date AND status = 'completed'),
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = v_date AND status = 'completed')
    FROM analytics_events
    WHERE DATE(created_at) = v_date
    ON CONFLICT (date)
    DO UPDATE SET
        total_page_views = EXCLUDED.total_page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        total_sessions = EXCLUDED.total_sessions,
        total_orders = EXCLUDED.total_orders,
        total_revenue = EXCLUDED.total_revenue;
    
    -- Update avg order value
    UPDATE analytics_daily_stats
    SET avg_order_value = CASE 
        WHEN total_orders > 0 THEN total_revenue / total_orders
        ELSE 0
    END
    WHERE date = v_date;
    
    -- Update conversion rate
    UPDATE analytics_daily_stats
    SET conversion_rate = CASE 
        WHEN unique_visitors > 0 THEN (total_orders::DECIMAL / unique_visitors * 100)
        ELSE 0
    END
    WHERE date = v_date;
END;
$$ LANGUAGE plpgsql;
