const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/accounts/upload
// @desc    Upload accounts for a product (Admin only)
// @access  Private/Admin
router.post('/upload', protect, admin, async (req, res) => {
    try {
        const { productId, accounts } = req.body;

        if (!productId || !accounts || !Array.isArray(accounts)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const accountDocs = accounts.map(acc => ({
            productId,
            account: acc.account || acc.email,
            password: acc.password,
            status: 'available'
        }));

        const result = await Account.insertMany(accountDocs);

        res.status(201).json({
            message: 'Accounts uploaded successfully',
            count: result.length
        });
    } catch (error) {
        console.error('Upload accounts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/accounts/product/:productId
// @desc    Get available accounts count for a product
// @access  Private/Admin
router.get('/product/:productId', protect, admin, async (req, res) => {
    try {
        const availableCount = await Account.countDocuments({
            productId: req.params.productId,
            status: 'available'
        });

        const soldCount = await Account.countDocuments({
            productId: req.params.productId,
            status: 'sold'
        });

        res.json({
            available: availableCount,
            sold: soldCount,
            total: availableCount + soldCount
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/accounts/assign
// @desc    Assign account to order (Internal use)
// @access  Private
router.post('/assign', protect, async (req, res) => {
    try {
        const { orderId, productId } = req.body;

        // Find available account
        const account = await Account.findOne({
            productId,
            status: 'available'
        });

        if (!account) {
            return res.status(404).json({ message: 'No available accounts' });
        }

        // Mark as sold
        account.status = 'sold';
        account.orderId = orderId;
        account.soldAt = new Date();
        await account.save();

        res.json({
            account: account.account,
            password: account.password
        });
    } catch (error) {
        console.error('Assign account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete account (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const account = await Account.findById(req.params.id);

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        await account.remove();

        res.json({ message: 'Account deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
