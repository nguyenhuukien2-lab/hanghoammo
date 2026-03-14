// Wishlist Routes
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const { data: wishlist, error } = await supabase
            .from('wishlist')
            .select(`
                *,
                products (*)
            `)
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, data: wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách yêu thích' });
    }
});

// Add to wishlist
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { product_id } = req.body;
        const user_id = req.user.id;
        
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu product_id' });
        }
        
        // Check if product exists
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id')
            .eq('id', product_id)
            .single();
        
        if (productError || !product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        
        // Check if already in wishlist
        const { data: existing } = await supabase
            .from('wishlist')
            .select('*')
            .eq('user_id', user_id)
            .eq('product_id', product_id)
            .single();
        
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Sản phẩm đã có trong danh sách yêu thích' 
            });
        }
        
        // Add to wishlist
        const { data: wishlistItem, error } = await supabase
            .from('wishlist')
            .insert({ user_id, product_id })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ 
            success: true, 
            data: wishlistItem, 
            message: 'Đã thêm vào danh sách yêu thích!' 
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ success: false, message: 'Lỗi thêm vào danh sách yêu thích' });
    }
});

// Remove from wishlist
router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const user_id = req.user.id;
        
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user_id)
            .eq('product_id', productId);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích!' });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa khỏi danh sách yêu thích' });
    }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const user_id = req.user.id;
        
        const { data, error } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', user_id)
            .eq('product_id', productId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        res.json({ success: true, inWishlist: !!data });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra wishlist' });
    }
});

// Get wishlist count
router.get('/count', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const { count, error } = await supabase
            .from('wishlist')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);
        
        if (error) throw error;
        
        res.json({ success: true, count });
    } catch (error) {
        console.error('Get wishlist count error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy số lượng wishlist' });
    }
});

module.exports = router;
