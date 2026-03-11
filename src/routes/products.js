const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Lấy tất cả sản phẩm (public)
router.get('/', async (req, res) => {
    try {
        const products = await db.getAllProducts();
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm'
        });
    }
});

// Lấy chi tiết sản phẩm (public)
router.get('/:id', async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sản phẩm'
        });
    }
});

// Tạo sản phẩm mới (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, price, image, badge, description } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin sản phẩm'
            });
        }

        const newProduct = await db.createProduct({
            name,
            category,
            price,
            image,
            badge,
            description,
            sold: 0
        });

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: newProduct
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo sản phẩm'
        });
    }
});

// Cập nhật sản phẩm (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, price, image, badge, description, sold } = req.body;

        const updatedProduct = await db.updateProduct(req.params.id, {
            name,
            category,
            price,
            image,
            badge,
            description,
            sold
        });

        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sản phẩm'
        });
    }
});

// Xóa sản phẩm (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.deleteProduct(req.params.id);
        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm'
        });
    }
});

module.exports = router;
