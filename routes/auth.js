const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Kiểm tra email đã tồn tại
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được đăng ký'
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = await db.createUser({
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'user'
        });

        // Tạo JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Gửi email chào mừng (không chờ)
        emailService.sendRegisterEmail(name, email).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        // Gửi Telegram notification nếu có chat_id (không chờ)
        if (req.body.telegram_chat_id) {
            telegramService.sendRegisterNotification(req.body.telegram_chat_id, name, email).catch(err => {
                console.error('Failed to send Telegram notification:', err);
            });
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký'
        });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền email và mật khẩu'
            });
        }

        // Tìm user
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Lấy thông tin ví
        const wallet = await db.getWallet(user.id);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                balance: wallet ? wallet.balance : 0
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập'
        });
    }
});

// Đổi mật khẩu
router.post('/change-password', async (req, res) => {
    try {
        const { email, phone, newPassword } = req.body;

        // Validate
        if (!email || !phone || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Tìm user và xác minh số điện thoại
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại'
            });
        }

        if (user.phone !== phone) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không khớp'
            });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu
        const supabase = require('../config/supabase');
        await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', user.id);

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đổi mật khẩu'
        });
    }
});

// Get current user info
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không có token xác thực'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await db.getUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const wallet = await db.getWallet(user.id);

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                balance: wallet ? wallet.balance : 0
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
});

module.exports = router;
