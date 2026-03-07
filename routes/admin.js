const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get dashboard stats
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'user' });
        
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort('-createdAt')
            .limit(10);
        
        // Top products
        const topProducts = await Product.find()
            .sort('-sold')
            .limit(10);
        
        res.json({
            success: true,
            stats: {
                totalProducts,
                totalOrders,
                totalCustomers,
                totalRevenue
            },
            recentOrders,
            topProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê',
            error: error.message
        });
    }
});

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email phone')
            .populate('items.product')
            .sort('-createdAt');
        
        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đơn hàng',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        
        if (orderStatus === 'completed') {
            order.deliveredAt = Date.now();
        }
        
        await order.save();
        
        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật trạng thái',
            error: error.message
        });
    }
});

// @route   GET /api/admin/customers
// @desc    Get all customers
// @access  Private/Admin
router.get('/customers', async (req, res) => {
    try {
        const customers = await User.find({ role: 'user' })
            .select('-password')
            .sort('-createdAt');
        
        // Get order count for each customer
        const customersWithOrders = await Promise.all(
            customers.map(async (customer) => {
                const orderCount = await Order.countDocuments({ user: customer._id });
                return {
                    ...customer.toObject(),
                    orderCount
                };
            })
        );
        
        res.json({
            success: true,
            count: customersWithOrders.length,
            customers: customersWithOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách khách hàng',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/customers/:id
// @desc    Delete customer
// @access  Private/Admin
router.delete('/customers/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }
        
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản admin'
            });
        }
        
        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'Xóa khách hàng thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa khách hàng',
            error: error.message
        });
    }
});

module.exports = router;
