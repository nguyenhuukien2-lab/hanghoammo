const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const { validateProduct, validateUUIDParam, validatePagination } = require('../middleware/validate');

// Lấy tất cả sản phẩm (public) - có pagination và tính giá theo tier nếu đăng nhập
router.get('/', validatePagination, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const category = req.query.category || null;
        const search = req.query.search || null;

        // Build query
        let query = supabase.from('products').select('*', { count: 'exact' });
        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('name', `%${search}%`);
        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data: products, error, count } = await query;
        if (error) throw error;

        // Tính giá theo tier nếu có token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                const { data: userData } = await supabase
                    .from('users')
                    .select('user_tier')
                    .eq('id', decoded.userId)
                    .single();
                
                if (userData) {
                    const { data: tierData } = await supabase
                        .from('tier_config')
                        .select('discount_percent')
                        .eq('tier_name', userData.user_tier)
                        .single();
                    
                    if (tierData && tierData.discount_percent > 0) {
                        products.forEach(product => {
                            const originalPrice = product.price;
                            const discountAmount = originalPrice * tierData.discount_percent / 100;
                            product.original_price = originalPrice;
                            product.price = originalPrice - discountAmount;
                            product.discount_percent = tierData.discount_percent;
                            product.savings = discountAmount;
                        });
                    }
                }
            } catch (tokenError) {
                // Token không hợp lệ, bỏ qua discount
            }
        }
        
        res.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
                hasNext: offset + limit < count,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm'
        });
    }
});

// Lấy chi tiết sản phẩm (public) - có tính giá theo tier nếu đăng nhập
router.get('/:id', async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        // Nếu có token, tính giá theo tier
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Lấy tier của user
                const { data: userData } = await supabase
                    .from('users')
                    .select('user_tier')
                    .eq('id', decoded.userId)
                    .single();
                
                if (userData) {
                    // Lấy discount percent của tier
                    const { data: tierData } = await supabase
                        .from('tier_config')
                        .select('discount_percent')
                        .eq('tier_name', userData.user_tier)
                        .single();
                    
                    if (tierData && tierData.discount_percent > 0) {
                        // Áp dụng discount
                        const originalPrice = product.price;
                        const discountAmount = originalPrice * tierData.discount_percent / 100;
                        product.original_price = originalPrice;
                        product.price = originalPrice - discountAmount;
                        product.discount_percent = tierData.discount_percent;
                        product.savings = discountAmount;
                    }
                }
            } catch (tokenError) {
                // Token không hợp lệ, bỏ qua việc tính discount
                console.log('Invalid token for pricing:', tokenError.message);
            }
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
router.post('/', authenticateToken, requireAdmin, validateProduct, async (req, res) => {
    try {
        const { name, category, price, image, badge, description, section } = req.body;

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
            section: section || null,
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
        const { name, category, price, image, badge, description, sold, section } = req.body;

        const updatedProduct = await db.updateProduct(req.params.id, {
            name,
            category,
            price,
            image,
            badge,
            description,
            sold,
            section: section !== undefined ? (section || null) : undefined
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
