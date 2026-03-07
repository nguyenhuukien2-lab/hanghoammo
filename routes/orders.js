const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { items, customerInfo, paymentMethod, note } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống'
            });
        }
        
        // Calculate total and update product info
        let totalAmount = 0;
        const orderItems = [];
        
        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm ${item.product}`
                });
            }
            
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image
            });
            
            totalAmount += product.price * item.quantity;
            
            // Update sold count
            product.sold += item.quantity;
            await product.save();
        }
        
        // Create order
        const order = await Order.create({
            user: req.user.id,
            customerInfo,
            items: orderItems,
            totalAmount,
            paymentMethod,
            note
        });
        
        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo đơn hàng',
            error: error.message
        });
    }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
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

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Make sure user owns order or is admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem đơn hàng này'
            });
        }
        
        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin đơn hàng',
            error: error.message
        });
    }
});

module.exports = router;
