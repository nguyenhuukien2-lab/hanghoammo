const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Lấy thông tin ví
router.get('/', authenticateToken, async (req, res) => {
    try {
        const wallet = await db.getWallet(req.user.id);
        res.json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin ví'
        });
    }
});

// Lấy lịch sử giao dịch
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await db.getTransactionsByUserId(req.user.id);
        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử giao dịch'
        });
    }
});

// Tạo yêu cầu nạp tiền
router.post('/deposit', authenticateToken, async (req, res) => {
    try {
        const { amount, payment_method, transaction_code, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền nạp không hợp lệ'
            });
        }

        const depositRequest = await db.createDepositRequest({
            user_id: req.user.id,
            amount,
            payment_method,
            transaction_code,
            note,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Tạo yêu cầu nạp tiền thành công. Vui lòng chờ admin duyệt.',
            data: depositRequest
        });
    } catch (error) {
        console.error('Create deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo yêu cầu nạp tiền'
        });
    }
});

// Lấy danh sách yêu cầu nạp tiền của user
router.get('/deposits', authenticateToken, async (req, res) => {
    try {
        const deposits = await db.getDepositRequestsByUserId(req.user.id);
        res.json({
            success: true,
            data: deposits
        });
    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách nạp tiền'
        });
    }
});

module.exports = router;
