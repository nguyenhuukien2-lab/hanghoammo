const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Get messages for current user
router.get('/my-messages', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tin nhắn'
        });
    }
});

// Send message (user)
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tin nhắn'
            });
        }
        
        const { data, error } = await supabase
            .from('messages')
            .insert({
                user_id: req.user.id,
                sender_type: 'user',
                message: message.trim(),
                is_read: false
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: data
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi tin nhắn'
        });
    }
});

// Mark messages as read (user)
router.post('/mark-read', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('user_id', req.user.id)
            .eq('sender_type', 'admin')
            .eq('is_read', false);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Đã đánh dấu đã đọc'
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu đã đọc'
        });
    }
});

// Get unread count (user)
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('sender_type', 'admin')
            .eq('is_read', false);
        
        if (error) throw error;
        
        res.json({
            success: true,
            count: count || 0
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy số tin nhắn chưa đọc'
        });
    }
});

// ==================== ADMIN ROUTES ====================

// Get all conversations (admin)
router.get('/admin/conversations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get unique users who have messages
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                user_id,
                users (id, name, email)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get unique users
        const usersMap = new Map();
        messages.forEach(msg => {
            if (msg.users && !usersMap.has(msg.user_id)) {
                usersMap.set(msg.user_id, msg.users);
            }
        });
        
        // Get unread count for each user
        const conversations = [];
        for (const [userId, user] of usersMap) {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('sender_type', 'user')
                .eq('is_read', false);
            
            // Get last message
            const { data: lastMsg } = await supabase
                .from('messages')
                .select('message, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            conversations.push({
                user_id: userId,
                user_name: user.name,
                user_email: user.email,
                unread_count: count || 0,
                last_message: lastMsg?.message || '',
                last_message_time: lastMsg?.created_at || null
            });
        }
        
        res.json({
            success: true,
            data: conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách hội thoại'
        });
    }
});

// Get messages for specific user (admin)
router.get('/admin/messages/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get user messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tin nhắn'
        });
    }
});

// Send message to user (admin)
router.post('/admin/send', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id, message } = req.body;
        
        if (!user_id || !message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }
        
        const { data, error } = await supabase
            .from('messages')
            .insert({
                user_id: user_id,
                sender_type: 'admin',
                message: message.trim(),
                is_read: false
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: data
        });
    } catch (error) {
        console.error('Admin send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi tin nhắn'
        });
    }
});

// Mark user messages as read (admin)
router.post('/admin/mark-read/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('sender_type', 'user')
            .eq('is_read', false);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Đã đánh dấu đã đọc'
        });
    } catch (error) {
        console.error('Admin mark read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu đã đọc'
        });
    }
});

module.exports = router;
