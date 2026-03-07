const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

// @route   POST /api/payment/create
// @desc    Create payment for order
// @access  Private
router.post('/create', protect, async (req, res) => {
    try {
        const { orderId, paymentMethod, amount } = req.body;

        if (!orderId || !paymentMethod || !amount) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        // Find order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        // Check if order belongs to user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized' 
            });
        }

        // Simulate payment processing
        // In production, integrate with real payment gateways
        const paymentData = {
            orderId,
            paymentMethod,
            amount,
            status: 'pending',
            transactionId: 'TXN' + Date.now(),
            createdAt: new Date()
        };

        // For demo purposes, auto-approve payment
        setTimeout(async () => {
            try {
                await processPaymentSuccess(orderId);
            } catch (error) {
                console.error('Auto payment processing error:', error);
            }
        }, 2000);

        res.json({
            success: true,
            message: 'Payment initiated',
            payment: paymentData
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @route   POST /api/payment/webhook
// @desc    Handle payment webhook (for real payment gateways)
// @access  Public
router.post('/webhook', async (req, res) => {
    try {
        const { orderId, status, transactionId } = req.body;

        if (status === 'success') {
            await processPaymentSuccess(orderId);
        } else if (status === 'failed') {
            await processPaymentFailed(orderId);
        }

        res.json({ 
            success: true,
            message: 'Webhook processed' 
        });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @route   GET /api/payment/status/:orderId
// @desc    Check payment status
// @access  Private
router.get('/status/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        res.json({
            success: true,
            status: order.paymentStatus,
            orderStatus: order.status
        });
    } catch (error) {
        console.error('Check payment status error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// Helper function to process successful payment
async function processPaymentSuccess(orderId) {
    try {
        const order = await Order.findById(orderId).populate('products.product');
        
        if (!order) {
            throw new Error('Order not found');
        }

        // Update order status
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await order.save();

        // Auto-deliver accounts for each product
        const deliveredAccounts = [];
        
        for (const item of order.products) {
            const productId = item.product._id || item.product;
            
            // Find available account
            const account = await Account.findOne({
                productId,
                status: 'available'
            });

            if (account) {
                // Mark account as sold
                account.status = 'sold';
                account.orderId = order._id;
                account.soldAt = new Date();
                await account.save();

                deliveredAccounts.push({
                    productName: item.product.name || item.name,
                    account: account.account,
                    password: account.password,
                    note: account.note
                });
            }
        }

        // Update order with delivered accounts
        order.deliveredAccounts = deliveredAccounts;
        order.status = 'completed';
        await order.save();

        console.log(`✅ Order ${orderId} paid and accounts delivered`);
        
        return deliveredAccounts;
    } catch (error) {
        console.error('Process payment success error:', error);
        throw error;
    }
}

// Helper function to process failed payment
async function processPaymentFailed(orderId) {
    try {
        const order = await Order.findById(orderId);
        
        if (!order) {
            throw new Error('Order not found');
        }

        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();

        console.log(`❌ Order ${orderId} payment failed`);
    } catch (error) {
        console.error('Process payment failed error:', error);
        throw error;
    }
}

module.exports = router;
