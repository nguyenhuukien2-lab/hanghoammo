// Reviews Routes
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('reviews')
            .select(`
                *,
                users:user_id (name, email)
            `)
            .eq('product_id', productId)
            .eq('status', 'approved')
            .range(offset, offset + limit - 1);
        
        // Sort
        if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (sort === 'highest') {
            query = query.order('rating', { ascending: false });
        } else if (sort === 'lowest') {
            query = query.order('rating', { ascending: true });
        } else if (sort === 'helpful') {
            query = query.order('helpful_count', { ascending: false });
        }
        
        const { data: reviews, error } = await query;
        
        if (error) throw error;
        
        // Get total count
        const { count } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', productId)
            .eq('status', 'approved');
        
        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy đánh giá' });
    }
});

// Get review statistics for a product
router.get('/product/:productId/stats', async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Get rating distribution
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId)
            .eq('status', 'approved');
        
        if (error) throw error;
        
        const stats = {
            total: reviews.length,
            average: 0,
            distribution: {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0
            }
        };
        
        if (reviews.length > 0) {
            reviews.forEach(review => {
                stats.distribution[review.rating]++;
            });
            
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            stats.average = (sum / reviews.length).toFixed(2);
        }
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê đánh giá' });
    }
});

// Create review
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { product_id, order_id, rating, comment, images } = req.body;
        const user_id = req.user.id;
        
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1-5 sao' });
        }
        
        // Check if user has purchased this product
        const { data: orderItem, error: orderError } = await supabase
            .from('order_items')
            .select('*, orders!inner(*)')
            .eq('product_id', product_id)
            .eq('orders.user_id', user_id)
            .eq('orders.status', 'completed')
            .single();
        
        if (orderError || !orderItem) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua' 
            });
        }
        
        // Check if already reviewed
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', product_id)
            .eq('user_id', user_id)
            .eq('order_id', order_id || orderItem.order_id)
            .single();
        
        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bạn đã đánh giá sản phẩm này rồi' 
            });
        }
        
        // Create review
        const { data: review, error } = await supabase
            .from('reviews')
            .insert({
                product_id,
                user_id,
                order_id: order_id || orderItem.order_id,
                rating,
                comment,
                images: images || [],
                status: 'approved' // Auto approve for now
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data: review, message: 'Đánh giá thành công!' });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo đánh giá' });
    }
});

// Update review
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, images } = req.body;
        const user_id = req.user.id;
        
        // Check ownership
        const { data: review, error: checkError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();
        
        if (checkError || !review) {
            return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
        }
        
        // Update review
        const { data: updated, error } = await supabase
            .from('reviews')
            .update({
                rating,
                comment,
                images,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data: updated, message: 'Cập nhật đánh giá thành công!' });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật đánh giá' });
    }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check ownership
        const { data: review, error: checkError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();
        
        if (checkError || !review) {
            return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
        }
        
        // Delete review
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Xóa đánh giá thành công!' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa đánh giá' });
    }
});

// Mark review as helpful
router.post('/:id/helpful', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if already marked
        const { data: existing } = await supabase
            .from('review_helpful')
            .select('*')
            .eq('review_id', id)
            .eq('user_id', user_id)
            .single();
        
        if (existing) {
            // Remove helpful mark
            await supabase
                .from('review_helpful')
                .delete()
                .eq('review_id', id)
                .eq('user_id', user_id);
            
            // Decrease count
            await supabase.rpc('decrement_helpful_count', { review_id: id });
            
            return res.json({ success: true, helpful: false });
        } else {
            // Add helpful mark
            await supabase
                .from('review_helpful')
                .insert({ review_id: id, user_id });
            
            // Increase count
            await supabase.rpc('increment_helpful_count', { review_id: id });
            
            return res.json({ success: true, helpful: true });
        }
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({ success: false, message: 'Lỗi đánh dấu hữu ích' });
    }
});

module.exports = router;
