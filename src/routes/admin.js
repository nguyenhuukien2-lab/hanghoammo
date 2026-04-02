const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');

// Get all deposit requests (admin only)
router.get('/deposits', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('deposit_requests')
            .select(`
                *,
                users (id, name, email, phone)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Format data
        const formatted = data.map(d => ({
            ...d,
            user_id: d.users.id,
            user_name: d.users.name,
            user_email: d.users.email,
            user_phone: d.users.phone
        }));
        
        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách nạp tiền'
        });
    }
});

// Approve deposit
router.post('/approve-deposit', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { deposit_id, user_id, amount } = req.body;

        if (!deposit_id || !user_id || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Validate amount - phải là số dương, không quá 50 triệu mỗi lần
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > 50000000) {
            return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ (1đ - 50,000,000đ)' });
        }

        // Verify deposit request tồn tại và còn pending
        const { data: deposit, error: depErr } = await supabase
            .from('deposit_requests')
            .select('id, status, amount, user_id')
            .eq('id', deposit_id)
            .single();

        if (depErr || !deposit) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu nạp tiền' });
        }
        if (deposit.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Yêu cầu này đã được xử lý rồi' });
        }
        // Đảm bảo user_id khớp với deposit
        if (deposit.user_id !== user_id) {
            return res.status(400).json({ success: false, message: 'Thông tin không khớp' });
        }
        // 1. Update deposit status
        await db.updateDepositRequest(deposit_id, { status: 'approved' });

        // 2. Get current wallet balance
        const wallet = await db.getWallet(user_id);
        const newBalance = wallet.balance + numAmount;

        // 3. Update wallet balance
        await db.updateWalletBalance(user_id, newBalance);

        // 4. Create transaction record
        await db.createTransaction({
            user_id: user_id,
            type: 'deposit',
            amount: numAmount,
            description: `Nạp tiền - Mã yêu cầu #${deposit_id}`,
            balance_after: newBalance
        });

        // 5. Get user info and send email
        const user = await db.getUserById(user_id);
        if (user && user.email) {
            emailService.sendDepositApprovedEmail(
                user.email, user.name, numAmount, newBalance
            ).catch(err => console.error('Failed to send deposit approved email:', err));

            if (user.telegram_chat_id) {
                telegramService.sendDepositApprovedNotification(
                    user.telegram_chat_id, user.name, numAmount, newBalance
                ).catch(err => console.error('Failed to send Telegram notification:', err));
            }
        }
        
        res.json({
            success: true,
            message: 'Duyệt nạp tiền thành công',
            data: {
                new_balance: newBalance
            }
        });
    } catch (error) {
        console.error('Approve deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt nạp tiền: ' + error.message
        });
    }
});

// Reject deposit
router.post('/reject-deposit', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { deposit_id, reason } = req.body;
        
        if (!deposit_id || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }
        
        await db.updateDepositRequest(deposit_id, {
            status: 'rejected',
            reject_reason: reason
        });
        
        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu nạp tiền'
        });
    } catch (error) {
        console.error('Reject deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối nạp tiền: ' + error.message
        });
    }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, phone, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách người dùng' });
    }
});

// Admin reset password cho user
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải ít nhất 8 ký tự' });
        }

        // Kiểm tra user tồn tại
        const { data: user, error: userErr } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', id)
            .single();

        if (userErr || !user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Không cho reset mật khẩu admin khác
        if (user.role === 'admin' && user.id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Không thể reset mật khẩu admin khác' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await supabase.from('users').update({ password: hashedPassword }).eq('id', id);

        console.log(`Admin ${req.user.email} reset password for user ${user.email}`);

        res.json({ success: true, message: `Đã reset mật khẩu cho ${user.email}` });
    } catch (error) {
        console.error('Admin reset password error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi reset mật khẩu' });
    }
});

// Admin ban/unban user
router.post('/users/:id/toggle-ban', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: user, error: userErr } = await supabase
            .from('users')
            .select('id, email, role, status')
            .eq('id', id)
            .single();

        if (userErr || !user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể ban tài khoản admin' });
        }

        const newStatus = user.status === 'banned' ? 'active' : 'banned';
        await supabase.from('users').update({ status: newStatus }).eq('id', id);

        res.json({ success: true, message: `Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${user.email}`, status: newStatus });
    } catch (error) {
        console.error('Toggle ban error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi thay đổi trạng thái' });
    }
});

// Get all orders (admin only)
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orders = await db.getAllOrders();
        
        // Format orders with user email and items count
        const formatted = await Promise.all(orders.map(async (order) => {
            const user = await db.getUserById(order.user_id);
            return {
                id: order.id,
                user_id: order.user_id,
                user_email: user ? user.email : 'Unknown',
                total_amount: order.total_amount,
                status: order.status,
                created_at: order.created_at,
                items_count: order.order_items ? order.order_items.length : 0
            };
        }));
        
        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng'
        });
    }
});

// ==================== ACCOUNTS MANAGEMENT ====================

// Get all accounts
router.get('/accounts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, status } = req.query;
        
        let query = supabase
            .from('accounts')
            .select(`
                *,
                products (name)
            `)
            .order('created_at', { ascending: false });
        
        if (product_id) {
            query = query.eq('product_id', product_id);
        }
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Format data
        const accounts = data.map(acc => ({
            ...acc,
            product_name: acc.products?.name
        }));
        
        res.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tài khoản'
        });
    }
});

// Add accounts (single or bulk)
router.post('/accounts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, accounts } = req.body;
        
        if (!product_id || !accounts || accounts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin sản phẩm hoặc tài khoản'
            });
        }
        
        // Prepare accounts data
        const accountsData = accounts.map(acc => ({
            product_id: product_id,
            username: acc.username,
            password: acc.password,
            status: 'available'
        }));
        
        const { data, error } = await supabase
            .from('accounts')
            .insert(accountsData)
            .select();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: `Đã thêm ${data.length} tài khoản`,
            data: data
        });
    } catch (error) {
        console.error('Add accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm tài khoản: ' + error.message
        });
    }
});

// Delete account
router.delete('/accounts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if account is sold
        const { data: account } = await supabase
            .from('accounts')
            .select('status')
            .eq('id', id)
            .single();
        
        if (account && account.status === 'sold') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản đã bán'
            });
        }
        
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Đã xóa tài khoản'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tài khoản'
        });
    }
});

// ==================== TRANSACTIONS MANAGEMENT ====================

// Get all transactions
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                users (id, name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách giao dịch'
        });
    }
});

// ==================== CHAT MANAGEMENT ====================

// Get all chat conversations
router.get('/chats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                users (id, name, email)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách hội thoại'
        });
    }
});

// ==================== ANALYTICS FOR ADMIN ====================

// Get analytics summary
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get page views
        const { count: pageViews, error: pvError } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'page_view');
        
        // Get unique visitors (count distinct session_id)
        const { data: sessions, error: sessError } = await supabase
            .from('analytics_events')
            .select('session_id')
            .eq('event_type', 'page_view');
        
        const uniqueVisitors = sessions ? new Set(sessions.map(s => s.session_id)).size : 0;
        
        // Get total events
        const { count: events, error: evError } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true });
        
        // Calculate average time (mock for now)
        const avgTime = 45;
        
        res.json({
            success: true,
            data: {
                pageViews: pageViews || 0,
                uniqueVisitors: uniqueVisitors,
                events: events || 0,
                avgTime: avgTime
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải analytics: ' + error.message
        });
    }
});

// Get top pages
router.get('/analytics/top-pages', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('analytics_events')
            .select('page_url, page_title')
            .eq('event_type', 'page_view')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        
        // Count by page
        const pageCounts = {};
        data.forEach(event => {
            const url = event.page_url || 'Unknown';
            pageCounts[url] = (pageCounts[url] || 0) + 1;
        });
        
        // Convert to array and sort
        const topPages = Object.entries(pageCounts)
            .map(([url, views]) => ({ url, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);
        
        res.json({
            success: true,
            data: topPages
        });
    } catch (error) {
        console.error('Get top pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy top pages'
        });
    }
});

// Get recent events
router.get('/analytics/recent-events', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('analytics_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get recent events error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy recent events'
        });
    }
});

// ==================== NOTIFICATIONS MANAGEMENT ====================

// Get all notifications
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Mock notifications for now
        const notifications = [
            {
                id: 1,
                type: 'info',
                content: 'Chào mừng đến với HangHoaMMO!',
                active: true,
                created_at: new Date().toISOString()
            }
        ];
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy notifications'
        });
    }
});

// Create notification
router.post('/notifications', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { type, content, active } = req.body;
        
        // Mock save for now
        const notification = {
            id: Date.now(),
            type,
            content,
            active: active !== false,
            created_at: new Date().toISOString()
        };
        
        res.json({
            success: true,
            message: 'Đã tạo thông báo',
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo notification'
        });
    }
});

// Delete notification
router.delete('/notifications/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: 'Đã xóa thông báo'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa notification'
        });
    }
});

// ==================== SETTINGS MANAGEMENT ====================

// Get settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Mock settings
        const settings = {
            maintenance: {
                enabled: false,
                message: 'Website đang bảo trì. Vui lòng quay lại sau.',
                eta: '30 phút'
            },
            shop: {
                name: 'HangHoaMMO',
                phone: '0879.06.2222',
                email: 'support@hanghoammo.com',
                telegram: 'https://t.me/hanghoammo'
            }
        };
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy settings'
        });
    }
});

// Update settings
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const settings = req.body;
        
        // Mock save
        res.json({
            success: true,
            message: 'Đã lưu cài đặt',
            data: settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lưu settings'
        });
    }
});

module.exports = router;
