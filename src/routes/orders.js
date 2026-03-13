const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');

// Create order and deduct from wallet
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { items, total_amount, payment_method, voucher_id, voucher_code, discount_amount } = req.body;
        
        // Debug log
        console.log('=== CREATE ORDER REQUEST ===');
        console.log('User:', req.user.email);
        console.log('Items:', JSON.stringify(items, null, 2));
        console.log('Total:', total_amount);
        console.log('Payment method:', payment_method);
        console.log('Voucher:', voucher_code, 'Discount:', discount_amount);
        
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
        
        // Validate product_id format (should be UUID)
        for (const item of items) {
            if (!item.product_id || typeof item.product_id === 'number') {
                console.error('Invalid product_id:', item.product_id, 'Type:', typeof item.product_id);
                return res.status(400).json({
                    success: false,
                    message: 'ID sản phẩm không hợp lệ. Vui lòng refresh trang và thử lại!'
                });
            }
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
            const orderData = {
                user_id: req.user.id,
                total: total_amount,
                payment_method: 'wallet',
                status: 'completed',
                order_code: 'DH' + Date.now().toString().slice(-8)
            };
            
            // Add voucher info if applied
            if (voucher_id && discount_amount) {
                orderData.voucher_id = voucher_id;
                orderData.discount_amount = discount_amount;
            }
            
            const order = await db.createOrder(orderData);
            
            // Create order items and assign accounts
            const deliveredAccounts = [];
            
            for (const item of items) {
                const quantity = item.quantity || 1;
                
                // Get available accounts for this product
                for (let i = 0; i < quantity; i++) {
                    try {
                        const account = await db.getAvailableAccount(item.product_id);
                        
                        if (account) {
                            // Mark account as sold
                            await db.markAccountAsSold(account.id, req.user.id, order.id);
                            
                            // Create order item with account
                            const { error: itemError } = await db.supabase
                                .from('order_items')
                                .insert({
                                    order_id: order.id,
                                    product_id: item.product_id,
                                    product_name: item.name,
                                    product_price: item.price,
                                    quantity: 1,
                                    account_id: account.id
                                });
                            
                            if (itemError) {
                                console.error('Error creating order item:', itemError);
                                throw itemError;
                            }
                            
                            // Add to delivered accounts list
                            deliveredAccounts.push({
                                product_name: item.name,
                                username: account.username,
                                password: account.password
                            });
                        } else {
                            // No account available - create order item without account
                            const { error: itemError } = await db.supabase
                                .from('order_items')
                                .insert({
                                    order_id: order.id,
                                    product_id: item.product_id,
                                    product_name: item.name,
                                    product_price: item.price,
                                    quantity: 1,
                                    account_id: null
                                });
                            
                            if (itemError) {
                                console.error('Error creating order item without account:', itemError);
                                throw itemError;
                            }
                        }
                    } catch (itemErr) {
                        console.error('Error processing item:', item, itemErr);
                        throw new Error(`Lỗi xử lý sản phẩm ${item.name}: ${itemErr.message}`);
                    }
                }
            }
            
            // Deduct from wallet
            const newBalance = wallet.balance - total_amount;
            await db.updateWalletBalance(req.user.id, newBalance);
            
            // Create transaction record
            await db.createTransaction({
                user_id: req.user.id,
                type: 'purchase',
                amount: total_amount,
                balance_before: wallet.balance,
                balance_after: newBalance,
                description: `Mua hàng - Đơn #${order.order_code}`,
                order_id: order.id
            });
            
            // Apply voucher if provided
            if (voucher_id && discount_amount) {
                try {
                    await fetch('http://localhost:3002/api/vouchers/apply', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': req.headers.authorization
                        },
                        body: JSON.stringify({
                            voucher_id,
                            order_id: order.id,
                            discount_amount
                        })
                    });
                } catch (voucherErr) {
                    console.error('Failed to record voucher usage:', voucherErr);
                    // Don't fail the order if voucher recording fails
                }
            }

            // Gửi email xác nhận đơn hàng (không chờ)
            emailService.sendOrderEmail(
                req.user.email,
                req.user.name,
                order.order_code,
                total_amount,
                items,
                deliveredAccounts
            ).catch(err => {
                console.error('Failed to send order email:', err);
            });

            // Gửi Telegram notification nếu có chat_id (không chờ)
            if (req.user.telegram_chat_id) {
                telegramService.sendOrderNotification(
                    req.user.telegram_chat_id,
                    req.user.name,
                    order.order_code,
                    total_amount,
                    items,
                    deliveredAccounts
                ).catch(err => {
                    console.error('Failed to send Telegram notification:', err);
                });
            }
            
            return res.json({
                success: true,
                message: 'Đặt hàng thành công!',
                data: {
                    order_id: order.id,
                    order_code: order.order_code,
                    new_balance: newBalance,
                    accounts: deliveredAccounts
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
        const { data, error } = await db.supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    accounts (
                        username,
                        password
                    )
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data
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
