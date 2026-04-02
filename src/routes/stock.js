const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// =====================================================
// PUBLIC ROUTES - Stock info
// =====================================================

// GET /api/stock/products - Lấy sản phẩm với thông tin stock
router.get('/products', async (req, res) => {
    try {
        const { category, search, sort, limit = 20, offset = 0 } = req.query;
        
        let query = supabase
            .from('products')
            .select('*');

        // Filter by category
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Search
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Sort
        if (sort === 'price_asc') {
            query = query.order('price', { ascending: true });
        } else if (sort === 'price_desc') {
            query = query.order('price', { ascending: false });
        } else if (sort === 'popular') {
            query = query.order('sold', { ascending: false });
        } else if (sort === 'stock_low') {
            query = query.order('stock', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Pagination
        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data, error } = await query;

        if (error) throw error;

        // Lấy số tài khoản available thực tế từ DB
        const productIds = (data || []).map(p => p.id);
        let stockMap = {};
        if (productIds.length > 0) {
            const { data: accountCounts } = await supabase
                .from('accounts')
                .select('product_id')
                .in('product_id', productIds)
                .eq('status', 'available');
            (accountCounts || []).forEach(a => {
                stockMap[a.product_id] = (stockMap[a.product_id] || 0) + 1;
            });
        }

        const productsWithStock = (data || []).map(product => {
            const stock = stockMap[product.id] || 0;
            let stockStatus, stockClass, stockDisplay;
            if (stock <= 0) {
                stockStatus = 'out-of-stock'; stockClass = 'out-of-stock'; stockDisplay = 'Hết hàng';
            } else if (stock <= 5) {
                stockStatus = 'low-stock'; stockClass = 'low-stock'; stockDisplay = `Chỉ còn ${stock}`;
            } else {
                stockStatus = 'in-stock'; stockClass = 'in-stock'; stockDisplay = `${stock} có sẵn`;
            }
            return { ...product, stock, stock_status: stockStatus, stock_class: stockClass, stock_display: stockDisplay, has_active_flash_sale: false };
        });

        // Apply tier pricing if user is logged in
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Get user tier
                const { data: userData } = await supabase
                    .from('users')
                    .select('user_tier')
                    .eq('id', decoded.userId)
                    .single();
                
                if (userData) {
                    // Get discount percent
                    const { data: tierData } = await supabase
                        .from('tier_config')
                        .select('discount_percent')
                        .eq('tier_name', userData.user_tier)
                        .single();
                    
                    if (tierData && tierData.discount_percent > 0) {
                        // Apply discount to all products
                        productsWithStock.forEach(product => {
                            const originalPrice = product.has_active_flash_sale ? 
                                product.flash_sale_price : product.price;
                            const discountAmount = originalPrice * tierData.discount_percent / 100;
                            
                            product.tier_original_price = originalPrice;
                            product.tier_price = originalPrice - discountAmount;
                            product.tier_discount_percent = tierData.discount_percent;
                            product.tier_savings = discountAmount;
                        });
                    }
                }
            } catch (tokenError) {
                // Invalid token, ignore tier pricing
                console.log('Invalid token for pricing:', tokenError.message);
            }
        }

        res.json({
            success: true,
            data: productsWithStock,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: productsWithStock.length
            }
        });
    } catch (error) {
        console.error('Get products with stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
});

// GET /api/stock/product/:id - Lấy chi tiết sản phẩm với stock
router.get('/product/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Lấy số tài khoản available thực tế
        const { data: accountCount } = await supabase
            .from('accounts')
            .select('id')
            .eq('product_id', req.params.id)
            .eq('status', 'available');
        const stock = (accountCount || []).length;

        let stockStatus, stockClass, stockDisplay;
        if (stock <= 0) {
            stockStatus = 'out-of-stock'; stockClass = 'out-of-stock'; stockDisplay = 'Hết hàng';
        } else if (stock <= 5) {
            stockStatus = 'low-stock'; stockClass = 'low-stock'; stockDisplay = `Chỉ còn ${stock}`;
        } else {
            stockStatus = 'in-stock'; stockClass = 'in-stock'; stockDisplay = `${stock} có sẵn`;
        }

        const productWithStock = { ...data, stock, stock_status: stockStatus, stock_class: stockClass, stock_display: stockDisplay, has_active_flash_sale: false };

        // Apply tier pricing if user is logged in
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Get user tier
                const { data: userData } = await supabase
                    .from('users')
                    .select('user_tier')
                    .eq('id', decoded.userId)
                    .single();
                
                if (userData) {
                    // Get discount percent
                    const { data: tierData } = await supabase
                        .from('tier_config')
                        .select('discount_percent')
                        .eq('tier_name', userData.user_tier)
                        .single();
                    
                    if (tierData && tierData.discount_percent > 0) {
                        const originalPrice = productWithStock.has_active_flash_sale ? 
                            productWithStock.flash_sale_price : productWithStock.price;
                        const discountAmount = originalPrice * tierData.discount_percent / 100;
                        
                        productWithStock.tier_original_price = originalPrice;
                        productWithStock.tier_price = originalPrice - discountAmount;
                        productWithStock.tier_discount_percent = tierData.discount_percent;
                        productWithStock.tier_savings = discountAmount;
                    }
                }
            } catch (tokenError) {
                console.log('Invalid token for pricing:', tokenError.message);
            }
        }

        res.json({
            success: true,
            data: productWithStock
        });
    } catch (error) {
        console.error('Get product with stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sản phẩm',
            error: error.message
        });
    }
});

// GET /api/stock/flash-sales - Lấy danh sách flash sales active
router.get('/flash-sales', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('flash_sales')
            .select(`
                *,
                product:products(id, name, image, category)
            `)
            .eq('is_active', true)
            .lte('start_time', new Date().toISOString())
            .gte('end_time', new Date().toISOString())
            .order('end_time', { ascending: true });

        // If table doesn't exist yet, return empty array
        if (error && error.code === '42P01') {
            return res.json({
                success: true,
                data: []
            });
        }

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get flash sales error:', error);
        res.json({
            success: true,
            data: [] // Return empty instead of error
        });
    }
});

// =====================================================
// ADMIN ROUTES - Stock management
// =====================================================

// GET /api/stock/admin/history - Lịch sử thay đổi stock
router.get('/admin/history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, limit = 50, offset = 0 } = req.query;
        
        let query = supabase
            .from('stock_history')
            .select(`
                *,
                product:products(id, name),
                user:users(id, email, full_name)
            `)
            .order('created_at', { ascending: false });

        if (product_id) {
            query = query.eq('product_id', product_id);
        }

        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get stock history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử stock',
            error: error.message
        });
    }
});

// POST /api/stock/admin/update - Cập nhật stock sản phẩm
router.post('/admin/update', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, new_stock, reason } = req.body;

        if (!product_id || new_stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin product_id hoặc new_stock'
            });
        }

        // Get current stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', product_id)
            .single();

        if (productError) throw productError;

        // Update stock
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: parseInt(new_stock) })
            .eq('id', product_id);

        if (updateError) throw updateError;

        // Log manual stock change
        const { error: logError } = await supabase
            .from('stock_history')
            .insert({
                product_id: product_id,
                change_type: 'manual',
                quantity_change: parseInt(new_stock) - product.stock,
                old_stock: product.stock,
                new_stock: parseInt(new_stock),
                reason: reason || 'Manual update by admin',
                user_id: req.user.userId
            });

        if (logError) throw logError;

        res.json({
            success: true,
            message: 'Cập nhật stock thành công',
            data: {
                product_id: product_id,
                old_stock: product.stock,
                new_stock: parseInt(new_stock)
            }
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật stock',
            error: error.message
        });
    }
});

// POST /api/stock/admin/flash-sale - Tạo flash sale
router.post('/admin/flash-sale', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            product_id, 
            title, 
            description, 
            sale_price, 
            start_time, 
            end_time, 
            max_quantity 
        } = req.body;

        if (!product_id || !title || !sale_price || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Get product original price
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('price')
            .eq('id', product_id)
            .single();

        if (productError) throw productError;

        const { data, error } = await supabase
            .from('flash_sales')
            .insert({
                product_id,
                title,
                description,
                original_price: product.price,
                sale_price: parseFloat(sale_price),
                start_time,
                end_time,
                max_quantity: max_quantity ? parseInt(max_quantity) : null
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tạo flash sale thành công',
            data: data
        });
    } catch (error) {
        console.error('Create flash sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo flash sale',
            error: error.message
        });
    }
});

// PUT /api/stock/admin/flash-sale/:id - Cập nhật flash sale
router.put('/admin/flash-sale/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, sale_price, start_time, end_time, max_quantity, is_active } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (sale_price !== undefined) updateData.sale_price = parseFloat(sale_price);
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_time !== undefined) updateData.end_time = end_time;
        if (max_quantity !== undefined) updateData.max_quantity = max_quantity ? parseInt(max_quantity) : null;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabase
            .from('flash_sales')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, message: 'Cập nhật flash sale thành công', data });
    } catch (error) {
        console.error('Update flash sale error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật flash sale', error: error.message });
    }
});

// DELETE /api/stock/admin/flash-sale/:id - Xóa flash sale
router.delete('/admin/flash-sale/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('flash_sales')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ success: true, message: 'Xóa flash sale thành công' });
    } catch (error) {
        console.error('Delete flash sale error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa flash sale', error: error.message });
    }
});

// GET /api/stock/admin/flash-sales - Lấy tất cả flash sales (admin)
router.get('/admin/flash-sales', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('flash_sales')
            .select(`*, product:products(id, name, image)`)
            .order('created_at', { ascending: false });

        if (error && error.code === '42P01') return res.json({ success: true, data: [] });
        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Get all flash sales error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách flash sale', error: error.message });
    }
});

// GET /api/stock/admin/previews/:productId - Lấy previews của sản phẩm
router.get('/admin/previews/:productId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('product_previews')
            .select('*')
            .eq('product_id', req.params.productId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Get previews error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy previews', error: error.message });
    }
});

// DELETE /api/stock/admin/preview/:id - Xóa preview
router.delete('/admin/preview/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('product_previews')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Xóa preview thành công' });
    } catch (error) {
        console.error('Delete preview error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa preview', error: error.message });
    }
});

// POST /api/stock/admin/preview - Thêm preview image
router.post('/admin/preview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            product_id, 
            preview_type, 
            preview_url, 
            preview_title, 
            preview_description,
            is_blurred = true,
            display_order = 0
        } = req.body;

        if (!product_id || !preview_url) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu product_id hoặc preview_url'
            });
        }

        const { data, error } = await supabase
            .from('product_previews')
            .insert({
                product_id,
                preview_type: preview_type || 'screenshot',
                preview_url,
                preview_title,
                preview_description,
                is_blurred,
                display_order
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Thêm preview thành công',
            data: data
        });
    } catch (error) {
        console.error('Add preview error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm preview',
            error: error.message
        });
    }
});

module.exports = router;