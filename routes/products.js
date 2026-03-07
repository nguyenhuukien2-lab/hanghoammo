const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, search, sort, limit = 50 } = req.query;
        
        let query = { isActive: true };
        
        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        // Build sort
        let sortOption = {};
        if (sort === 'price-asc') sortOption.price = 1;
        else if (sort === 'price-desc') sortOption.price = -1;
        else if (sort === 'name-asc') sortOption.name = 1;
        else if (sort === 'name-desc') sortOption.name = -1;
        else sortOption.createdAt = -1;
        
        const products = await Product.find(query)
            .sort(sortOption)
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách sản phẩm',
            error: error.message
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin sản phẩm',
            error: error.message
        });
    }
});

// @route   POST /api/products
// @desc    Create product
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        req.body.createdBy = req.user.id;
        const product = await Product.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo sản phẩm',
            error: error.message
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật sản phẩm',
            error: error.message
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        await product.deleteOne();
        
        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa sản phẩm',
            error: error.message
        });
    }
});

module.exports = router;
