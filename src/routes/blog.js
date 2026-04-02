// Blog Routes
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Helper function to generate slug
function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Get all published posts
router.get('/posts', async (req, res) => {
    try {
        const { page = 1, limit = 12, category, tag, search, featured } = req.query;
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('blog_posts')
            .select(`
                *,
                blog_categories:category_id (id, name, slug),
                users:author_id (name, email)
            `, { count: 'exact' })
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (category) {
            query = query.eq('category_id', category);
        }
        
        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }
        
        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }
        
        const { data: posts, error, count } = await query;
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách bài viết' });
    }
});

// Get single post by slug
router.get('/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const { data: post, error } = await supabase
            .from('blog_posts')
            .select(`
                *,
                blog_categories:category_id (id, name, slug),
                users:author_id (name, email)
            `)
            .eq('slug', slug)
            .eq('status', 'published')
            .single();
        
        if (error) throw error;
        
        if (!post) {
            return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
        }
        
        // Increment view count
        await supabase
            .from('blog_posts')
            .update({ view_count: post.view_count + 1 })
            .eq('id', post.id);
        
        // Get tags
        const { data: tags } = await supabase
            .from('blog_post_tags')
            .select('blog_tags(*)')
            .eq('post_id', post.id);
        
        post.tags = tags?.map(t => t.blog_tags) || [];
        
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy bài viết' });
    }
});

// Create post (Admin/Author only)
router.post('/posts', authenticateToken, async (req, res) => {
    try {
        const postData = {
            ...req.body,
            author_id: req.user.id,
            slug: generateSlug(req.body.title)
        };
        
        if (postData.status === 'published' && !postData.published_at) {
            postData.published_at = new Date().toISOString();
        }
        
        const { data: post, error } = await supabase
            .from('blog_posts')
            .insert(postData)
            .select()
            .single();
        
        if (error) throw error;
        
        // Add tags if provided
        if (req.body.tags && req.body.tags.length > 0) {
            for (const tagName of req.body.tags) {
                // Get or create tag
                let { data: tag } = await supabase
                    .from('blog_tags')
                    .select('*')
                    .eq('slug', generateSlug(tagName))
                    .single();
                
                if (!tag) {
                    const { data: newTag } = await supabase
                        .from('blog_tags')
                        .insert({
                            name: tagName,
                            slug: generateSlug(tagName)
                        })
                        .select()
                        .single();
                    
                    tag = newTag;
                }
                
                // Link tag to post
                if (tag) {
                    await supabase
                        .from('blog_post_tags')
                        .insert({
                            post_id: post.id,
                            tag_id: tag.id
                        });
                }
            }
        }
        
        res.json({ success: true, data: post, message: 'Tạo bài viết thành công!' });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo bài viết' });
    }
});

// Update post
router.put('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check ownership or admin
        const { data: post } = await supabase
            .from('blog_posts')
            .select('author_id')
            .eq('id', id)
            .single();
        
        if (!post || (post.author_id !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        
        if (req.body.title) {
            updateData.slug = generateSlug(req.body.title);
        }
        
        if (updateData.status === 'published' && !post.published_at) {
            updateData.published_at = new Date().toISOString();
        }
        
        const { data: updated, error } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data: updated, message: 'Cập nhật bài viết thành công!' });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật bài viết' });
    }
});

// Delete post
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check ownership or admin
        const { data: post } = await supabase
            .from('blog_posts')
            .select('author_id')
            .eq('id', id)
            .single();
        
        if (!post || (post.author_id !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Xóa bài viết thành công!' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa bài viết' });
    }
});

// Get categories
router.get('/categories', async (req, res) => {
    try {
        const { data: categories, error } = await supabase
            .from('blog_categories')
            .select('*')
            .eq('status', 'active')
            .order('name');
        
        if (error) throw error;
        
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' });
    }
});

// Get tags
router.get('/tags', async (req, res) => {
    try {
        const { data: tags, error } = await supabase
            .from('blog_tags')
            .select('*')
            .order('post_count', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        res.json({ success: true, data: tags });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy tags' });
    }
});

// Like/Unlike post
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if already liked
        const { data: existing } = await supabase
            .from('blog_likes')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', user_id)
            .single();
        
        if (existing) {
            // Unlike
            await supabase
                .from('blog_likes')
                .delete()
                .eq('post_id', id)
                .eq('user_id', user_id);
            
            return res.json({ success: true, liked: false });
        } else {
            // Like
            await supabase
                .from('blog_likes')
                .insert({ post_id: id, user_id });
            
            return res.json({ success: true, liked: true });
        }
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ success: false, message: 'Lỗi thích bài viết' });
    }
});

// Get comments for post
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: comments, error } = await supabase
            .from('blog_comments')
            .select(`
                *,
                users:user_id (name, email)
            `)
            .eq('post_id', id)
            .eq('status', 'approved')
            .is('parent_id', null)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get replies for each comment
        for (const comment of comments) {
            const { data: replies } = await supabase
                .from('blog_comments')
                .select(`
                    *,
                    users:user_id (name, email)
                `)
                .eq('parent_id', comment.id)
                .eq('status', 'approved')
                .order('created_at', { ascending: true });
            
            comment.replies = replies || [];
        }
        
        res.json({ success: true, data: comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy bình luận' });
    }
});

// Create comment
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parent_id } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Nội dung bình luận không được trống' });
        }

        // Nếu là reply, kiểm tra parent phải là top-level (không cho reply lồng 3 cấp)
        if (parent_id) {
            const { data: parent } = await supabase
                .from('blog_comments')
                .select('parent_id, post_id')
                .eq('id', parent_id)
                .single();

            if (!parent) {
                return res.status(404).json({ success: false, message: 'Bình luận gốc không tồn tại' });
            }
            if (parent.post_id !== id) {
                return res.status(400).json({ success: false, message: 'Bình luận không thuộc bài viết này' });
            }
            // Nếu parent đã là reply → gán lại về parent của nó (flatten về 1 cấp)
            // Giữ nguyên parent_id của parent để reply luôn thuộc top-level comment
        }
        
        const { data: comment, error } = await supabase
            .from('blog_comments')
            .insert({
                post_id: id,
                user_id: req.user.id,
                parent_id: parent_id || null,
                content: content.trim(),
                status: 'approved'
            })
            .select(`*, users:user_id (name, email)`)
            .single();
        
        if (error) throw error;

        // Cập nhật comment_count trên bài viết
        await supabase.rpc('increment_comment_count', { post_id: id }).catch(() => {
            // Nếu RPC chưa có thì update thủ công
            supabase.from('blog_posts')
                .select('comment_count')
                .eq('id', id)
                .single()
                .then(({ data }) => {
                    if (data) {
                        supabase.from('blog_posts')
                            .update({ comment_count: (data.comment_count || 0) + 1 })
                            .eq('id', id);
                    }
                });
        });
        
        res.json({ success: true, data: comment, message: 'Bình luận thành công!' });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo bình luận' });
    }
});

// Update comment (chỉ chủ comment)
router.put('/posts/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Nội dung không được trống' });
        }

        const { data: existing } = await supabase
            .from('blog_comments')
            .select('user_id')
            .eq('id', commentId)
            .single();

        if (!existing) return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
        if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa' });
        }

        const { data, error } = await supabase
            .from('blog_comments')
            .update({ content: content.trim(), updated_at: new Date().toISOString() })
            .eq('id', commentId)
            .select(`*, users:user_id (name, email)`)
            .single();

        if (error) throw error;
        res.json({ success: true, data, message: 'Cập nhật bình luận thành công!' });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật bình luận' });
    }
});

// Delete comment (chủ comment hoặc admin)
router.delete('/posts/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { postId, commentId } = req.params;

        const { data: existing } = await supabase
            .from('blog_comments')
            .select('user_id')
            .eq('id', commentId)
            .single();

        if (!existing) return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
        if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
        }

        // Xóa replies trước, rồi xóa comment
        await supabase.from('blog_comments').delete().eq('parent_id', commentId);
        await supabase.from('blog_comments').delete().eq('id', commentId);

        // Giảm comment_count
        const { data: post } = await supabase.from('blog_posts').select('comment_count').eq('id', postId).single();
        if (post) {
            await supabase.from('blog_posts')
                .update({ comment_count: Math.max(0, (post.comment_count || 1) - 1) })
                .eq('id', postId);
        }

        res.json({ success: true, message: 'Xóa bình luận thành công!' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa bình luận' });
    }
});

module.exports = router;
