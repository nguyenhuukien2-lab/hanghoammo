const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const supabase = require('../config/supabase');
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
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }
        
        // 1. Update deposit status
        await db.updateDepositRequest(deposit_id, {
            status: 'approved'
        });
        
        // 2. Get current wallet balance
        const wallet = await db.getWallet(user_id);
        const newBalance = wallet.balance + amount;
        
        // 3. Update wallet balance
        await db.updateWalletBalance(user_id, newBalance);
        
        // 4. Create transaction record
        await db.createTransaction({
            user_id: user_id,
            type: 'deposit',
            amount: amount,
            description: `Nạp tiền - Mã yêu cầu #${deposit_id}`,
            balance_after: newBalance
        });

        // 5. Get user info and send email
        const user = await db.getUserById(user_id);
        if (user && user.email) {
            emailService.sendDepositApprovedEmail(
                user.email,
                user.name,
                amount,
                newBalance
            ).catch(err => {
                console.error('Failed to send deposit approved email:', err);
            });

            // Gửi Telegram notification nếu có chat_id
            if (user.telegram_chat_id) {
                telegramService.sendDepositApprovedNotification(
                    user.telegram_chat_id,
                    user.name,
                    amount,
                    newBalance
                ).catch(err => {
                    console.error('Failed to send Telegram notification:', err);
                });
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
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng'
        });
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
router.get('/accounts', requireAdmin, async (req, res) => {
    try {
        const { product_id, status } = req.query;
        
        let query = db.supabase
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
router.post('/accounts', requireAdmin, async (req, res) => {
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
        
        const { data, error } = await db.supabase
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
router.delete('/accounts/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if account is sold
        const { data: account } = await db.supabase
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
        
        const { error } = await db.supabase
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

module.exports = router;
