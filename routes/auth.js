const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');
const supabase = require('../config/supabase');

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
        const { email, phone, newPassword, otp } = req.body;

        // Validate
        if (!email || !phone || !newPassword || !otp) {
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

        // Verify OTP
        const { data: otpData, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('user_id', user.id)
            .eq('otp', otp)
            .eq('used', false)
            .single();

        if (otpError || !otpData) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ'
            });
        }

        // Check if OTP expired
        if (new Date(otpData.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới'
            });
        }

        // Mark OTP as used
        await supabase
            .from('password_reset_otps')
            .update({ used: true })
            .eq('user_id', user.id);

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu
        await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', user.id);

        // Send email notification
        emailService.sendPasswordChangedEmail(user.name, user.email).catch(err => {
            console.error('Failed to send password changed email:', err);
        });

        // Send Telegram notification if available
        if (user.telegram_chat_id) {
            telegramService.sendTelegramMessage(
                user.telegram_chat_id,
                `🔒 <b>Mật khẩu đã thay đổi</b>\n\n` +
                `Mật khẩu tài khoản của bạn đã được đặt lại thành công.\n\n` +
                `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
                `📧 Email: ${user.email}\n\n` +
                `⚠️ Nếu bạn KHÔNG thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi!\n\n` +
                `📱 Telegram: @hanghoammo\n` +
                `📞 Hotline: 0879.06.2222`,
                { parse_mode: 'HTML' }
            ).catch(err => {
                console.error('Failed to send Telegram notification:', err);
            });
        }

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

// Request OTP for forgot password (public - no auth required)
router.post('/request-forgot-password-otp', async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền email và số điện thoại'
            });
        }

        // Find user and verify phone
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

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in database with expiry (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await supabase
            .from('password_reset_otps')
            .upsert({
                user_id: user.id,
                otp: otp,
                expires_at: expiresAt.toISOString(),
                used: false
            }, {
                onConflict: 'user_id'
            });

        // Send OTP via email
        await emailService.sendPasswordOTPEmail(user.name, user.email, otp);

        // Send OTP via Telegram if available
        if (user.telegram_chat_id) {
            telegramService.sendTelegramMessage(
                user.telegram_chat_id,
                `🔐 <b>Mã xác nhận đặt lại mật khẩu</b>\n\n` +
                `Mã OTP của bạn là: <code>${otp}</code>\n\n` +
                `⏰ Mã có hiệu lực trong 5 phút\n` +
                `⚠️ Không chia sẻ mã này với bất kỳ ai!`,
                { parse_mode: 'HTML' }
            ).catch(err => {
                console.error('Failed to send Telegram OTP:', err);
            });
        }

        res.json({
            success: true,
            message: 'Mã OTP đã được gửi qua email' + (user.telegram_chat_id ? ' và Telegram' : '')
        });
    } catch (error) {
        console.error('Request forgot password OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi mã OTP'
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

// Update Telegram Chat ID
router.post('/update-telegram', async (req, res) => {
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
        
        const { telegram_chat_id } = req.body;
        
        if (!telegram_chat_id) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập Telegram Chat ID'
            });
        }

        // Update telegram_chat_id
        await supabase
            .from('users')
            .update({ telegram_chat_id: telegram_chat_id })
            .eq('id', decoded.userId);

        res.json({
            success: true,
            message: 'Cập nhật Telegram Chat ID thành công!'
        });
    } catch (error) {
        console.error('Update telegram error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật Telegram Chat ID'
        });
    }
});

// Update profile
router.post('/update-profile', async (req, res) => {
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
        
        const { name, phone } = req.body;
        
        // Update user info
        const { error } = await supabase
            .from('users')
            .update({ 
                name: name || undefined,
                phone: phone || undefined
            })
            .eq('id', decoded.userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công!'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin'
        });
    }
});

// Request OTP for password change
router.post('/request-password-otp', async (req, res) => {
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
        
        // Get user
        const user = await db.getUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in database with expiry (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        
        await supabase
            .from('password_reset_otps')
            .upsert({
                user_id: decoded.userId,
                otp: otp,
                expires_at: expiresAt.toISOString(),
                used: false
            }, {
                onConflict: 'user_id'
            });

        // Send OTP via email
        await emailService.sendPasswordOTPEmail(user.name, user.email, otp);

        // Send OTP via Telegram if available
        if (user.telegram_chat_id) {
            telegramService.sendTelegramMessage(
                user.telegram_chat_id,
                `🔐 <b>Mã xác nhận đổi mật khẩu</b>\n\n` +
                `Mã OTP của bạn là: <code>${otp}</code>\n\n` +
                `⏰ Mã có hiệu lực trong 5 phút\n` +
                `⚠️ Không chia sẻ mã này với bất kỳ ai!`,
                { parse_mode: 'HTML' }
            ).catch(err => {
                console.error('Failed to send Telegram OTP:', err);
            });
        }

        res.json({
            success: true,
            message: 'Mã OTP đã được gửi qua email và Telegram (nếu có)'
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi mã OTP'
        });
    }
});

// Change password (authenticated) with OTP verification
router.post('/change-password-auth', async (req, res) => {
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
        
        const { currentPassword, newPassword, otp } = req.body;
        
        if (!currentPassword || !newPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Get user
        const user = await db.getUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Verify OTP
        const { data: otpData, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('user_id', decoded.userId)
            .eq('otp', otp)
            .eq('used', false)
            .single();

        if (otpError || !otpData) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ'
            });
        }

        // Check if OTP expired
        if (new Date(otpData.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới'
            });
        }

        // Mark OTP as used
        await supabase
            .from('password_reset_otps')
            .update({ used: true })
            .eq('user_id', decoded.userId);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', decoded.userId);

        // Send email notification (không chờ)
        emailService.sendPasswordChangedEmail(user.name, user.email).catch(err => {
            console.error('Failed to send password changed email:', err);
        });

        // Send Telegram notification if available (không chờ)
        if (user.telegram_chat_id) {
            telegramService.sendTelegramMessage(
                user.telegram_chat_id,
                `🔒 <b>Mật khẩu đã thay đổi</b>\n\n` +
                `Mật khẩu tài khoản của bạn đã được thay đổi thành công.\n\n` +
                `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
                `📧 Email: ${user.email}\n\n` +
                `⚠️ Nếu bạn KHÔNG thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi!\n\n` +
                `📱 Telegram: @hanghoammo\n` +
                `📞 Hotline: 0879.06.2222`,
                { parse_mode: 'HTML' }
            ).catch(err => {
                console.error('Failed to send Telegram notification:', err);
            });
        }

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công! Email xác nhận đã được gửi.'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đổi mật khẩu'
        });
    }
});

module.exports = router;
