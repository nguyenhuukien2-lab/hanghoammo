const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

// Setup admin account (one-time use)
router.post('/create-admin', async (req, res) => {
    try {
        const { secret } = req.body;
        
        // Simple security check
        if (secret !== 'hanghoammo2025') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }
        
        const email = 'admin@hanghoammo.com';
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if admin exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            // Update to admin role and password
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    password: hashedPassword,
                    role: 'admin',
                    name: 'Admin'
                })
                .eq('email', email);
            
            if (updateError) throw updateError;
            
            return res.json({
                success: true,
                message: 'Admin đã tồn tại. Đã cập nhật password và role.',
                credentials: {
                    email: 'admin@hanghoammo.com',
                    password: 'Admin@123'
                }
            });
        }
        
        // Create new admin
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
                name: 'Admin',
                email: email,
                phone: '0879062222',
                password: hashedPassword,
                role: 'admin'
            }])
            .select()
            .single();
        
        if (userError) throw userError;
        
        // Create wallet for admin
        const { error: walletError } = await supabase
            .from('wallet')
            .insert([{
                user_id: newUser.id,
                balance: 0
            }]);
        
        if (walletError) throw walletError;
        
        res.json({
            success: true,
            message: 'Tạo tài khoản admin thành công!',
            credentials: {
                email: 'admin@hanghoammo.com',
                password: 'Admin@123'
            }
        });
        
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo admin: ' + error.message
        });
    }
});

module.exports = router;
