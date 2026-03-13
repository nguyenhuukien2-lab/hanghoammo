// Analytics Routes
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const UAParser = require('ua-parser-js');

// Track event
router.post('/track', async (req, res) => {
    try {
        const {
            event_type,
            page_url,
            page_title,
            referrer,
            product_id,
            order_id,
            event_data,
            session_id
        } = req.body;
        
        // Parse user agent
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();
        
        // Get IP address
        const ip_address = req.headers['x-forwarded-for']?.split(',')[0] || 
                          req.connection.remoteAddress;
        
        // Get user ID if authenticated
        const authHeader = req.headers['authorization'];
        let user_id = null;
        
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user } } = await supabase.auth.getUser(token);
                user_id = user?.id;
            } catch (e) {
                // Not authenticated, continue without user_id
            }
        }
        
        // Insert event
        const { error } = await supabase
            .from('analytics_events')
            .insert({
                event_type,
                user_id,
                session_id,
                page_url,
                page_title,
                referrer,
                product_id,
                order_id,
                event_data,
                user_agent: req.headers['user-agent'],
                ip_address,
                device_type: uaResult.device.type || 'desktop',
                browser: uaResult.browser.name,
                os: uaResult.os.name
            });
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track event error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tracking' });
    }
});

// Get dashboard stats (Admin only)
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const { period = '7d' } = req.query;
        
        // Calculate date range
        let startDate = new Date();
        if (period === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (period === '90d') {
            startDate.setDate(startDate.getDate() - 90);
        }
        
        // Get daily stats
        const { data: dailyStats, error } = await supabase
            .from('analytics_daily_stats')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        // Calculate totals
        const totals = {
            totalPageViews: 0,
            uniqueVisitors: 0,
            totalOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            conversionRate: 0
        };
        
        dailyStats.forEach(stat => {
            totals.totalPageViews += stat.total_page_views;
            totals.uniqueVisitors += stat.unique_visitors;
            totals.totalOrders += stat.total_orders;
            totals.totalRevenue += parseFloat(stat.total_revenue);
        });
        
        if (totals.totalOrders > 0) {
            totals.avgOrderValue = totals.totalRevenue / totals.totalOrders;
        }
        
        if (totals.uniqueVisitors > 0) {
            totals.conversionRate = (totals.totalOrders / totals.uniqueVisitors) * 100;
        }
        
        res.json({
            success: true,
            data: {
                dailyStats,
                totals
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê' });
    }
});

// Get product analytics (Admin only)
router.get('/products/:productId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const { productId } = req.params;
        const { period = '30d' } = req.query;
        
        let startDate = new Date();
        if (period === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (period === '90d') {
            startDate.setDate(startDate.getDate() - 90);
        }
        
        const { data: analytics, error } = await supabase
            .from('product_analytics')
            .select('*')
            .eq('product_id', productId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        // Calculate totals
        const totals = {
            totalViews: 0,
            uniqueViews: 0,
            addToCart: 0,
            purchases: 0,
            revenue: 0,
            conversionRate: 0
        };
        
        analytics.forEach(stat => {
            totals.totalViews += stat.views;
            totals.uniqueViews += stat.unique_views;
            totals.addToCart += stat.add_to_cart;
            totals.purchases += stat.purchases;
            totals.revenue += parseFloat(stat.revenue);
        });
        
        if (totals.uniqueViews > 0) {
            totals.conversionRate = (totals.purchases / totals.uniqueViews) * 100;
        }
        
        res.json({
            success: true,
            data: {
                analytics,
                totals
            }
        });
    } catch (error) {
        console.error('Get product analytics error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê sản phẩm' });
    }
});

// Get top products (Admin only)
router.get('/top-products', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const { period = '30d', limit = 10 } = req.query;
        
        let startDate = new Date();
        if (period === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (period === '90d') {
            startDate.setDate(startDate.getDate() - 90);
        }
        
        // Get top products by revenue
        const { data: topProducts, error } = await supabase
            .from('product_analytics')
            .select(`
                product_id,
                products:product_id (name, image, price),
                SUM(views) as total_views,
                SUM(purchases) as total_purchases,
                SUM(revenue) as total_revenue
            `)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('total_revenue', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        res.json({ success: true, data: topProducts });
    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy top sản phẩm' });
    }
});

// Get traffic sources (Admin only)
router.get('/traffic-sources', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const { period = '30d' } = req.query;
        
        let startDate = new Date();
        if (period === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (period === '90d') {
            startDate.setDate(startDate.getDate() - 90);
        }
        
        // Get referrers
        const { data: events, error } = await supabase
            .from('analytics_events')
            .select('referrer')
            .eq('event_type', 'page_view')
            .gte('created_at', startDate.toISOString())
            .not('referrer', 'is', null);
        
        if (error) throw error;
        
        // Group by source
        const sources = {};
        events.forEach(event => {
            try {
                const url = new URL(event.referrer);
                const domain = url.hostname;
                sources[domain] = (sources[domain] || 0) + 1;
            } catch (e) {
                sources['direct'] = (sources['direct'] || 0) + 1;
            }
        });
        
        // Convert to array and sort
        const sortedSources = Object.entries(sources)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count);
        
        res.json({ success: true, data: sortedSources });
    } catch (error) {
        console.error('Get traffic sources error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy nguồn traffic' });
    }
});

// Get device breakdown (Admin only)
router.get('/devices', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const { period = '30d' } = req.query;
        
        let startDate = new Date();
        if (period === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (period === '90d') {
            startDate.setDate(startDate.getDate() - 90);
        }
        
        const { data: devices, error } = await supabase
            .from('analytics_events')
            .select('device_type')
            .eq('event_type', 'page_view')
            .gte('created_at', startDate.toISOString());
        
        if (error) throw error;
        
        // Count by device type
        const breakdown = {};
        devices.forEach(event => {
            const device = event.device_type || 'unknown';
            breakdown[device] = (breakdown[device] || 0) + 1;
        });
        
        res.json({ success: true, data: breakdown });
    } catch (error) {
        console.error('Get device breakdown error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê thiết bị' });
    }
});

module.exports = router;
