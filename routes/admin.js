const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền truy cập'
        });
    }
    next();
}

// Get all deposit requests (admin only)
router.get('/deposits', authenticateToken, isAdmin, async (req, res) => {
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
router.post('/approve-deposit', authenticateToken, isAdmin, async (req, res) => {
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
            status: 'approved',
            approved_at: new Date(),
            approved_by: req.user.id
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
router.post('/reject-deposit', authenticateToken, isAdmin, async (req, res) => {
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
            rejected_at: new Date(),
            rejected_by: req.user.id,
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
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
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
router.get('/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await db.getAllOrders();
        
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng'
        });
    }
});

module.exports = router;
