// Payment Routes
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// ─── Thông tin chuyển khoản ngân hàng ────────────────────────────────────────
router.get('/bank-info', (req, res) => {
    res.json({
        success: true,
        data: {
            banks: [
                {
                    bank: 'Vietcombank',
                    account_number: process.env.BANK_ACCOUNT_VCB || '1234567890',
                    account_name: process.env.BANK_ACCOUNT_NAME || 'NGUYEN HUU KIEN',
                    branch: 'Chi nhánh TP.HCM'
                },
                {
                    bank: 'MBBank',
                    account_number: process.env.BANK_ACCOUNT_MB || '0987654321',
                    account_name: process.env.BANK_ACCOUNT_NAME || 'NGUYEN HUU KIEN',
                    branch: 'Chi nhánh TP.HCM'
                }
            ],
            note: 'Nội dung chuyển khoản: NAP [email] [số tiền]',
            min_amount: 10000,
            processing_time: '5-15 phút trong giờ hành chính'
        }
    });
});

// ─── Tạo yêu cầu nạp tiền (chuyển khoản) ────────────────────────────────────
router.post('/deposit/request', authenticateToken, async (req, res) => {
    try {
        const { amount, payment_method = 'bank_transfer', bank_name, transaction_ref } = req.body;

        if (!amount || amount < 10000) {
            return res.status(400).json({ success: false, message: 'Số tiền tối thiểu 10,000đ' });
        }

        const { data, error } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: req.user.id || req.user.userId,
                amount: parseFloat(amount),
                payment_method,
                bank_name,
                transaction_ref,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Yêu cầu nạp tiền đã được gửi. Admin sẽ duyệt trong 5-15 phút.',
            data
        });
    } catch (error) {
        console.error('Deposit request error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo yêu cầu nạp tiền' });
    }
});

// Create VNPay payment
router.post('/vnpay/create', authenticateToken, async (req, res) => {
    try {
        const { orderId, amount, orderInfo } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Verify order exists and belongs to user
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', req.user.id)
            .single();
        
        if (error || !order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Đơn hàng đã được xử lý' });
        }
        
        const paymentUrl = paymentService.createVNPayPayment(
            orderId,
            amount || order.total_amount,
            orderInfo || `Thanh toan don hang ${orderId}`,
            ipAddr
        );
        
        // Update order payment method
        await supabase
            .from('orders')
            .update({ payment_method: 'vnpay' })
            .eq('id', orderId);
        
        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error('VNPay create error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo thanh toán VNPay' });
    }
});

// VNPay callback
router.get('/vnpay/callback', async (req, res) => {
    try {
        const vnp_Params = req.query;
        const isValid = paymentService.verifyVNPayCallback(vnp_Params);
        
        if (!isValid) {
            return res.redirect('/checkout.html?payment=failed&reason=invalid_signature');
        }
        
        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionNo = vnp_Params['vnp_TransactionNo'];
        const amount = vnp_Params['vnp_Amount'] / 100;
        
        if (responseCode === '00') {
            // Payment success
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_status: 'completed',
                    transaction_id: transactionNo,
                    paid_at: new Date().toISOString()
                })
                .eq('id', orderId);
            
            if (error) {
                console.error('Update order error:', error);
            }
            
            res.redirect(`/orders.html?payment=success&orderId=${orderId}`);
        } else {
            // Payment failed
            res.redirect(`/checkout.html?payment=failed&orderId=${orderId}&code=${responseCode}`);
        }
    } catch (error) {
        console.error('VNPay callback error:', error);
        res.redirect('/checkout.html?payment=error');
    }
});

// Create Momo payment
router.post('/momo/create', authenticateToken, async (req, res) => {
    try {
        const { orderId, amount, orderInfo } = req.body;
        
        // Verify order exists and belongs to user
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', req.user.id)
            .single();
        
        if (error || !order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Đơn hàng đã được xử lý' });
        }
        
        const result = await paymentService.createMomoPayment(
            orderId,
            amount || order.total_amount,
            orderInfo || `Thanh toan don hang ${orderId}`
        );
        
        if (result.resultCode === 0) {
            // Update order payment method
            await supabase
                .from('orders')
                .update({ payment_method: 'momo' })
                .eq('id', orderId);
            
            res.json({ success: true, paymentUrl: result.payUrl });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Momo create error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo thanh toán Momo' });
    }
});

// Momo callback
router.get('/momo/callback', async (req, res) => {
    try {
        const data = req.query;
        const isValid = paymentService.verifyMomoCallback(data);
        
        if (!isValid) {
            return res.redirect('/checkout.html?payment=failed&reason=invalid_signature');
        }
        
        const orderId = data.orderId;
        const resultCode = data.resultCode;
        const transId = data.transId;
        
        if (resultCode === '0') {
            // Payment success
            await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_status: 'completed',
                    transaction_id: transId,
                    paid_at: new Date().toISOString()
                })
                .eq('id', orderId);
            
            res.redirect(`/orders.html?payment=success&orderId=${orderId}`);
        } else {
            // Payment failed
            res.redirect(`/checkout.html?payment=failed&orderId=${orderId}&code=${resultCode}`);
        }
    } catch (error) {
        console.error('Momo callback error:', error);
        res.redirect('/checkout.html?payment=error');
    }
});

// Momo IPN (Instant Payment Notification)
router.post('/momo/notify', async (req, res) => {
    try {
        const data = req.body;
        const isValid = paymentService.verifyMomoCallback(data);
        
        if (!isValid) {
            return res.json({ resultCode: 97, message: 'Invalid signature' });
        }
        
        const orderId = data.orderId;
        const resultCode = data.resultCode;
        const transId = data.transId;
        
        if (resultCode === '0') {
            await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_status: 'completed',
                    transaction_id: transId,
                    paid_at: new Date().toISOString()
                })
                .eq('id', orderId);
        }
        
        res.json({ resultCode: 0, message: 'Success' });
    } catch (error) {
        console.error('Momo notify error:', error);
        res.json({ resultCode: 99, message: 'Error' });
    }
});

module.exports = router;
