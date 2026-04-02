const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all active vouchers
router.get('/', async (req, res) => {
    try {
        const { data: vouchers, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('status', 'active')
            .lte('start_date', new Date().toISOString())
            .gte('end_date', new Date().toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, data: vouchers });
    } catch (error) {
        console.error('Get vouchers error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách voucher' });
    }
});

// Get all vouchers (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: vouchers, error } = await supabase
            .from('vouchers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, data: vouchers });
    } catch (error) {
        console.error('Get all vouchers error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách voucher' });
    }
});

// Validate voucher
router.post('/validate', authenticateToken, async (req, res) => {
    try {
        const { code, orderAmount, productIds } = req.body;
        const user_id = req.user.id;
        
        if (!code) {
            return res.status(400).json({ success: false, message: 'Thiếu mã voucher' });
        }
        
        // Get voucher
        const { data: voucher, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();
        
        if (error || !voucher) {
            return res.status(404).json({ success: false, message: 'Mã voucher không tồn tại' });
        }
        
        // Check status
        if (voucher.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Mã voucher không khả dụng' });
        }
        
        // Check dates
        const now = new Date();
        const startDate = new Date(voucher.start_date);
        const endDate = new Date(voucher.end_date);
        
        if (now < startDate) {
            return res.status(400).json({ 
                success: false, 
                message: `Mã voucher chưa có hiệu lực (từ ${startDate.toLocaleDateString('vi-VN')})` 
            });
        }
        
        if (now > endDate) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết hạn' });
        }
        
        // Check usage limit
        if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết lượt sử dụng' });
        }
        
        // Check per user limit
        const { count: userUsageCount } = await supabase
            .from('voucher_usage')
            .select('*', { count: 'exact', head: true })
            .eq('voucher_id', voucher.id)
            .eq('user_id', user_id);
        
        if (userUsageCount >= voucher.per_user_limit) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bạn đã sử dụng hết lượt cho mã voucher này' 
            });
        }
        
        // Check minimum order amount
        if (orderAmount < voucher.min_order_amount) {
            return res.status(400).json({ 
                success: false, 
                message: `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString('vi-VN')}đ` 
            });
        }
        
        // Check applicable products
        if (voucher.applicable_products && voucher.applicable_products.length > 0) {
            const hasApplicableProduct = productIds.some(id => 
                voucher.applicable_products.includes(id)
            );
            
            if (!hasApplicableProduct) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã voucher không áp dụng cho sản phẩm này' 
                });
            }
        }
        
        // Calculate discount
        let discountAmount = 0;
        if (voucher.type === 'percentage') {
            discountAmount = (orderAmount * voucher.value) / 100;
            if (voucher.max_discount_amount) {
                discountAmount = Math.min(discountAmount, voucher.max_discount_amount);
            }
        } else if (voucher.type === 'fixed') {
            discountAmount = voucher.value;
        }
        
        discountAmount = Math.min(discountAmount, orderAmount);
        
        res.json({ 
            success: true, 
            data: {
                voucher,
                discountAmount,
                finalAmount: orderAmount - discountAmount
            },
            message: 'Áp dụng mã giảm giá thành công!'
        });
    } catch (error) {
        console.error('Validate voucher error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác thực voucher' });
    }
});

// Apply voucher to order (called when order is created)
router.post('/apply', authenticateToken, async (req, res) => {
    try {
        const { voucher_id, order_id, discount_amount } = req.body;
        const user_id = req.user.id;
        
        // Record usage
        const { data: usage, error } = await supabase
            .from('voucher_usage')
            .insert({
                voucher_id,
                user_id,
                order_id,
                discount_amount
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data: usage });
    } catch (error) {
        console.error('Apply voucher error:', error);
        res.status(500).json({ success: false, message: 'Lỗi áp dụng voucher' });
    }
});

// Create voucher (Admin only)
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const voucherData = {
            ...req.body,
            code: req.body.code.toUpperCase(),
            created_by: req.user.id
        };
        
        const { data: voucher, error } = await supabase
            .from('vouchers')
            .insert(voucherData)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data: voucher, message: 'Tạo voucher thành công!' });
    } catch (error) {
        console.error('Create voucher error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo voucher' });
    }
});

// Update voucher (Admin only)
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        
        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase();
        }
        
        const { data: voucher, error } = await supabase
            .from('vouchers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data: voucher, message: 'Cập nhật voucher thành công!' });
    } catch (error) {
        console.error('Update voucher error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật voucher' });
    }
});

// Delete voucher (Admin only)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('vouchers')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Xóa voucher thành công!' });
    } catch (error) {
        console.error('Delete voucher error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa voucher' });
    }
});

module.exports = router;
