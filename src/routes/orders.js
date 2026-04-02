const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');
const { supabase } = require('../config/supabase');
const { validateCreateOrder } = require('../middleware/validate');

// Tự động nâng cấp tier sau khi mua hàng
async function checkAndUpgradeTier(userId, purchaseAmount) {
    // Cộng thêm vào total_spent
    const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('total_spent, user_tier')
        .eq('id', userId)
        .single();

    if (userErr || !userData) return;

    const newTotalSpent = (parseFloat(userData.total_spent) || 0) + parseFloat(purchaseAmount);

    await supabase
        .from('users')
        .update({ total_spent: newTotalSpent })
        .eq('id', userId);

    // Tìm tier phù hợp nhất với total_spent mới
    const { data: tiers } = await supabase
        .from('tier_config')
        .select('*')
        .lte('min_spent', newTotalSpent)
        .order('min_spent', { ascending: false })
        .limit(1);

    if (!tiers || tiers.length === 0) return;

    const newTier = tiers[0].tier_name;
    if (newTier === userData.user_tier) return;

    // Nâng cấp tier
    await supabase
        .from('users')
        .update({ user_tier: newTier })
        .eq('id', userId);

    // Ghi lịch sử nâng cấp
    await supabase
        .from('tier_upgrade_history')
        .insert({
            user_id: userId,
            old_tier: userData.user_tier,
            new_tier: newTier,
            total_spent_at_upgrade: newTotalSpent,
            upgraded_at: new Date().toISOString()
        });

    console.log(`✅ User ${userId} upgraded: ${userData.user_tier} → ${newTier} (spent: ${newTotalSpent})`);
}

// Tự động tính hoa hồng affiliate khi có đơn hàng
async function processAffiliateCommission(userId, orderId, orderAmount) {
    try {
        // Tìm xem user này có được giới thiệu bởi affiliate nào không
        const { data: referral } = await supabase
            .from('referrals')
            .select('affiliate_id, id')
            .eq('referred_user_id', userId)
            .eq('status', 'active')
            .single();

        if (!referral) return;

        // Lấy commission rate của affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, commission_rate, total_earnings, available_balance')
            .eq('id', referral.affiliate_id)
            .single();

        if (!affiliate) return;

        const commissionAmount = parseFloat(orderAmount) * (parseFloat(affiliate.commission_rate) / 100);

        // Tạo commission record
        await supabase
            .from('affiliate_commissions')
            .insert({
                affiliate_id: affiliate.id,
                referral_id: referral.id,
                order_id: orderId,
                order_amount: orderAmount,
                commission_amount: commissionAmount,
                status: 'pending'
            });

        // Cập nhật tổng hoa hồng của affiliate
        await supabase
            .from('affiliates')
            .update({
                total_earnings: (parseFloat(affiliate.total_earnings) || 0) + commissionAmount,
                available_balance: (parseFloat(affiliate.available_balance) || 0) + commissionAmount
            })
            .eq('id', affiliate.id);

        console.log(`✅ Affiliate commission: ${commissionAmount} for affiliate ${affiliate.id}`);
    } catch (err) {
        console.error('Affiliate commission error:', err);
    }
}

// Create order and deduct from wallet
router.post('/create', authenticateToken, validateCreateOrder, async (req, res) => {
    try {
        const { items, total_amount, payment_method, voucher_id, voucher_code, discount_amount } = req.body;
        
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

        // Kiểm tra email đã xác thực chưa
        const { data: userCheck } = await supabase
            .from('users')
            .select('email_verified')
            .eq('id', req.user.id)
            .single();

        if (userCheck && userCheck.email_verified === false) {
            return res.status(403).json({
                success: false,
                message: 'Vui lòng xác thực email trước khi mua hàng. Kiểm tra hộp thư của bạn!',
                code: 'EMAIL_NOT_VERIFIED'
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
            
            // === BEGIN ATOMIC TRANSACTION ===
            // Tất cả operations phải thành công hoặc rollback hết
            
            try {
                // 1. Deduct wallet FIRST (atomic)
                const newBalance = wallet.balance - total_amount;
                const { error: walletError } = await supabase
                    .from('wallet')
                    .update({ balance: newBalance, updated_at: new Date() })
                    .eq('user_id', req.user.id)
                    .eq('balance', wallet.balance); // Optimistic locking
                
                if (walletError) throw new Error('Wallet update failed');
                
                // 2. Create order
                const orderData = {
                    user_id: req.user.id,
                    total: total_amount,
                    payment_method: 'wallet',
                    status: 'completed',
                    order_code: 'DH' + Date.now().toString().slice(-8)
                };
                
                if (voucher_id && discount_amount) {
                    orderData.voucher_id = voucher_id;
                    orderData.discount_amount = discount_amount;
                }
                
                const order = await db.createOrder(orderData);
                
                // 3. Create transaction record
                await db.createTransaction({
                    user_id: req.user.id,
                    type: 'purchase',
                    amount: total_amount,
                    balance_before: wallet.balance,
                    balance_after: newBalance,
                    description: `Mua hàng - Đơn #${order.order_code}`,
                    order_id: order.id
                });
                
                // 4. Create order items and assign accounts
            const deliveredAccounts = [];
            
            for (const item of items) {
                const quantity = item.quantity || 1;
                
                for (let i = 0; i < quantity; i++) {
                    try {
                        // getAvailableAccount now atomically claims the account via DB function
                        const account = await db.getAvailableAccount(item.product_id);
                        
                        if (account) {
                            // Update sold_to and order reference
                            await supabase
                                .from('accounts')
                                .update({ sold_to: req.user.id })
                                .eq('id', account.id);

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
                            
                            if (itemError) throw itemError;
                            
                            deliveredAccounts.push({
                                product_name: item.name,
                                username: account.username,
                                password: account.password
                            });
                        } else {
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
                            
                            if (itemError) throw itemError;
                        }
                    } catch (itemErr) {
                        console.error('Error processing item:', item.name, itemErr);
                        throw new Error(`Lỗi xử lý sản phẩm ${item.name}: ${itemErr.message}`);
                    }
                }
            }
            
            // 5. Apply voucher if provided
            if (voucher_id && discount_amount) {
                try {
                    await supabase.from('voucher_usage').insert({
                        voucher_id,
                        user_id: req.user.id,
                        order_id: order.id,
                        discount_amount
                    });
                } catch (voucherErr) {
                    console.error('Failed to record voucher usage:', voucherErr);
                }
            }

            // === END ATOMIC TRANSACTION ===

            // Auto tier upgrade sau khi mua hàng
            checkAndUpgradeTier(req.user.id, total_amount).catch(err => {
                console.error('Tier upgrade check failed:', err);
            });

            // Auto affiliate commission
            processAffiliateCommission(req.user.id, order.id, total_amount).catch(err => {
                console.error('Affiliate commission failed:', err);
            });

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

            // Gửi Telegram notification (luôn gửi vào nhóm admin, gửi user nếu có chat_id)
            telegramService.sendOrderNotification(
                req.user.telegram_chat_id || null,
                req.user.name,
                order.order_code,
                total_amount,
                items,
                deliveredAccounts,
                req.user.email
            ).catch(err => {
                console.error('Failed to send Telegram notification:', err);
            });
            
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
            } catch (transactionError) {
                // Rollback: refund wallet if order creation failed
                console.error('Transaction failed, rolling back:', transactionError);
                await supabase
                    .from('wallet')
                    .update({ balance: wallet.balance })
                    .eq('user_id', req.user.id);
                
                throw new Error('Giao dịch thất bại: ' + transactionError.message);
            }
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
