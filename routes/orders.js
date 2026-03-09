const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Create order and deduct from wallet
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { items, total_amount, payment_method } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống'
            });
        }
        
        if (!total_amount || total_amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền không hợp lệ'
            });
        }
        
        // If payment method is wallet, check balance and deduct
        if (payment_method === 'wallet') {
            const wallet = await db.getWallet(req.user.id);
            
            if (wallet.balance < total_amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Số dư không đủ. Vui lòng nạp thêm tiền!'
                });
            }
            
            // Create order
            const order = await db.createOrder({
                user_id: req.user.id,
                total: total_amount,
                payment_method: 'wallet',
                status: 'completed', // Auto complete for wallet payment
                order_code: 'DH' + Date.now().toString().slice(-8)
            });
            
            // Create order items
            for (const item of items) {
                await db.supabase
                    .from('order_items')
                    .insert({
                        order_id: order.id,
                        product_id: item.product_id,
                        product_name: item.name,
                        product_price: item.price,
                        quantity: item.quantity || 1
                    });
            }
            
            // Deduct from wallet
            const newBalance = wallet.balance - total_amount;
            await db.updateWalletBalance(req.user.id, newBalance);
            
            // Create transaction record
            await db.createTransaction({
                user_id: req.user.id,
                type: 'purchase',
                amount: total_amount,
                description: `Mua hàng - Đơn #${order.id}`,
                balance_after: newBalance,
                order_id: order.id
            });
            
            return res.json({
                success: true,
                message: 'Đặt hàng thành công!',
                data: {
                    order_id: order.id,
                    new_balance: newBalance
                }
            });
        }
        
        // Other payment methods (COD, etc.)
        const order = await db.createOrder({
            user_id: req.user.id,
            total: total_amount,
            payment_method: payment_method || 'cod',
            status: 'pending',
            order_code: 'DH' + Date.now().toString().slice(-8)
        });
        
        // Create order items
        for (const item of items) {
            await db.supabase
                .from('order_items')
                .insert({
                    order_id: order.id,
                    product_id: item.product_id,
                    product_name: item.name,
                    product_price: item.price,
                    quantity: item.quantity || 1
                });
        }
        
        res.json({
            success: true,
            message: 'Đặt hàng thành công!',
            data: {
                order_id: order.id
            }
        });
        
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng: ' + error.message
        });
    }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await db.getOrdersByUserId(req.user.id);
        
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
