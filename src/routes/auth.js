const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');
const { supabase } = require('../config/supabase');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const twoFactorService = require('../services/twoFactorService');

// Helper: set httpOnly auth cookie
function setAuthCookie(res, token) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'lax' : 'strict', // lax cho phép cross-site trên mobile
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải ít nhất 8 ký tự' });
        }

        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã được đăng ký' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.createUser({
            name, email, phone,
            password: hashedPassword,
            role: 'user',
            email_verified: false
        });

        // Tạo verification token
        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await supabase
            .from('users')
            .update({
                verification_token: verificationToken,
                verification_expires: verificationExpires
            })
            .eq('id', newUser.id);

        // Tạo ví cho user mới
        await supabase.from('wallet').insert([{ user_id: newUser.id, balance: 0 }]);

        // Tạo JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Gửi email xác thực (không chờ)
        const verificationLink = `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/verify-email?token=${verificationToken}`;
        emailService.sendEmailVerification(name, email, verificationLink).catch(err => {
            console.error('Failed to send verification email:', err);
        });

        // Gửi Telegram notification vào nhóm admin + chào mừng khách (không chờ)
        telegramService.sendRegisterNotification(null, name, email).catch(err => {
            console.error('Failed to send Telegram notification:', err);
        });

        // Gửi link mời nhóm Telegram cho khách nếu họ cung cấp chat_id
        if (req.body.telegram_chat_id) {
            telegramService.sendWelcomeWithGroupLink(req.body.telegram_chat_id, name).catch(err => {
                console.error('Failed to send welcome Telegram:', err);
            });
        }

        console.log('✅ Registration complete');
        setAuthCookie(res, token);        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                balance: 0
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

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền email và mật khẩu' });
        }

        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }
        
        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            return res.json({
                success: true,
                requires2FA: true,
                message: 'Vui lòng nhập mã xác thực 2FA',
                email: user.email
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

        setAuthCookie(res, token);
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

        // Validate new password complexity
        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8-128 ký tự' });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 chữ thường' });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 số' });
        }

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

// Get current user info - dùng authenticateToken middleware
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const wallet = await db.getWallet(req.user.id);
        res.json({
            success: true,
            data: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
                balance: wallet ? wallet.balance : 0
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Update Telegram Chat ID
router.post('/update-telegram', authenticateToken, async (req, res) => {
    try {
        const { telegram_chat_id } = req.body;

        if (!telegram_chat_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Telegram Chat ID' });
        }

        // Validate: chỉ cho phép số và dấu âm
        if (!/^-?\d+$/.test(telegram_chat_id)) {
            return res.status(400).json({ success: false, message: 'Telegram Chat ID không hợp lệ' });
        }

        await supabase
            .from('users')
            .update({ telegram_chat_id })
            .eq('id', req.user.id);

        res.json({ success: true, message: 'Cập nhật Telegram Chat ID thành công!' });
    } catch (error) {
        console.error('Update telegram error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật Telegram Chat ID' });
    }
});

// Update profile
router.post('/update-profile', authenticateToken, async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Validate
        if (name && (name.length < 2 || name.length > 100)) {
            return res.status(400).json({ success: false, message: 'Tên phải từ 2-100 ký tự' });
        }
        if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
        }

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (phone) updateData.phone = phone.trim();

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id);

        if (error) throw error;

        res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông tin' });
    }
});

// Request OTP for password change
router.post('/request-password-otp', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await supabase
            .from('password_reset_otps')
            .upsert({
                user_id: user.id,
                otp,
                expires_at: expiresAt.toISOString(),
                used: false
            }, { onConflict: 'user_id' });

        await emailService.sendPasswordOTPEmail(user.name, user.email, otp);

        if (user.telegram_chat_id) {
            telegramService.sendTelegramMessage(
                user.telegram_chat_id,
                `🔐 <b>Mã xác nhận đổi mật khẩu</b>\n\nMã OTP: <code>${otp}</code>\n\n⏰ Hiệu lực 5 phút\n⚠️ Không chia sẻ mã này!`,
                { parse_mode: 'HTML' }
            ).catch(() => {});
        }

        res.json({ success: true, message: 'Mã OTP đã được gửi qua email và Telegram (nếu có)' });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi gửi mã OTP' });
    }
});

// Change password (authenticated) with OTP verification
router.post('/change-password-auth', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, otp } = req.body;

        if (!currentPassword || !newPassword || !otp) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Validate new password complexity
        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8-128 ký tự' });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 chữ thường' });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 số' });
        }

        const user = await db.getUserById(req.user.id);
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }

        const { data: otpData, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('otp', otp)
            .eq('used', false)
            .single();

        if (otpError || !otpData) {
            return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ' });
        }
        if (new Date(otpData.expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
        }

        await supabase.from('password_reset_otps').update({ used: true }).eq('user_id', req.user.id);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('users').update({ password: hashedPassword }).eq('id', req.user.id);

        emailService.sendPasswordChangedEmail(user.name, user.email).catch(() => {});
        if (user.telegram_chat_id) {
            telegramService.sendTelegramMessage(
                user.telegram_chat_id,
                `🔒 <b>Mật khẩu đã thay đổi</b>\n\n⏰ ${new Date().toLocaleString('vi-VN')}\n📧 ${user.email}\n\n⚠️ Nếu không phải bạn, liên hệ ngay!`,
                { parse_mode: 'HTML' }
            ).catch(() => {});
        }

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi đổi mật khẩu' });
    }
});

// Forgot password - gửi link reset qua email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const user = await db.getUserByEmail(email);
        if (!user) {
            // Không tiết lộ email có tồn tại hay không (security)
            return res.json({
                success: true,
                message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi'
            });
        }

        // Tạo reset token
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await supabase
            .from('users')
            .update({
                reset_token: resetToken,
                reset_expires: resetExpires
            })
            .eq('id', user.id);

        // Gửi email
        const resetLink = `${process.env.BASE_URL || 'http://localhost:3001'}/reset-password.html?token=${resetToken}`;
        emailService.sendPasswordResetEmail(user.name, user.email, resetLink).catch(err => {
            console.error('Failed to send reset email:', err);
        });

        res.json({
            success: true,
            message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// Reset password với token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin'
            });
        }

        // Validate password complexity
        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8-128 ký tự' });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 chữ thường' });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 1 số' });
        }

        // Tìm user với token
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('reset_token', token)
            .single();

        if (error || !user) {
            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        // Kiểm tra token hết hạn
        if (new Date() > new Date(user.reset_expires)) {
            return res.status(400).json({
                success: false,
                message: 'Token đã hết hạn. Vui lòng yêu cầu lại'
            });
        }

        // Hash password mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật password và xóa token
        await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_token: null,
                reset_expires: null
            })
            .eq('id', user.id);

        // Gửi email thông báo
        emailService.sendPasswordChangedEmail(user.name, user.email).catch(err => {
            console.error('Failed to send password changed email:', err);
        });

        res.json({
            success: true,
            message: 'Đặt lại mật khẩu thành công'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// Verify email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send(`
                <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>❌ Token không hợp lệ</h1>
                    <p>Link xác thực không đúng định dạng.</p>
                </body></html>
            `);
        }

        // Tìm user với token
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('verification_token', token)
            .single();

        if (error || !user) {
            return res.status(400).send(`
                <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>❌ Token không tồn tại</h1>
                    <p>Link xác thực không hợp lệ hoặc đã được sử dụng.</p>
                    <a href="${process.env.BASE_URL || '/'}" style="color: #667eea;">Về trang chủ</a>
                </body></html>
            `);
        }

        // Kiểm tra token hết hạn
        if (new Date() > new Date(user.verification_expires)) {
            return res.status(400).send(`
                <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>⏰ Token đã hết hạn</h1>
                    <p>Link xác thực đã hết hiệu lực. Vui lòng đăng ký lại.</p>
                    <a href="${process.env.BASE_URL || '/'}" style="color: #667eea;">Về trang chủ</a>
                </body></html>
            `);
        }

        // Cập nhật email_verified
        await supabase
            .from('users')
            .update({
                email_verified: true,
                verification_token: null,
                verification_expires: null
            })
            .eq('id', user.id);

        // Gửi email chào mừng
        emailService.sendRegisterEmail(user.name, user.email).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        res.send(`
            <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: #26de81;">✅ Xác thực thành công!</h1>
                <p>Email của bạn đã được xác thực. Bạn có thể đăng nhập và sử dụng dịch vụ.</p>
                <a href="${process.env.BASE_URL || '/'}" 
                   style="display: inline-block; margin-top: 20px; padding: 12px 30px; 
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; text-decoration: none; border-radius: 25px;">
                    Đăng nhập ngay
                </a>
            </body></html>
        `);
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).send(`
            <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>❌ Lỗi server</h1>
                <p>Không thể xác thực email. Vui lòng thử lại sau.</p>
            </body></html>
        `);
    }
});

// Setup 2FA - Generate QR code (admin only)
router.post('/2fa/setup', authenticateToken, async (req, res) => {
    try {
        // Chỉ admin mới được bật 2FA
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '2FA chỉ dành cho admin'
            });
        }

        // Generate secret
        const { secret, otpauth_url } = twoFactorService.generateSecret(req.user.email);
        
        // Generate QR code
        const qrCode = await twoFactorService.generateQRCode(otpauth_url);
        
        // Lưu secret tạm (chưa enable)
        await supabase
            .from('users')
            .update({ two_factor_secret: secret })
            .eq('id', req.user.id);
        
        res.json({
            success: true,
            data: {
                secret,
                qrCode
            }
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thiết lập 2FA'
        });
    }
});

// Enable 2FA - Verify token and enable
router.post('/2fa/enable', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã xác thực'
            });
        }
        
        // Get user's secret
        const { data: user } = await supabase
            .from('users')
            .select('two_factor_secret')
            .eq('id', req.user.id)
            .single();
        
        if (!user || !user.two_factor_secret) {
            return res.status(400).json({
                success: false,
                message: 'Chưa thiết lập 2FA. Vui lòng quét QR code trước'
            });
        }
        
        // Verify token
        const isValid = twoFactorService.verifyToken(user.two_factor_secret, token);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Mã xác thực không đúng'
            });
        }
        
        // Enable 2FA
        await supabase
            .from('users')
            .update({ two_factor_enabled: true })
            .eq('id', req.user.id);
        
        res.json({
            success: true,
            message: '2FA đã được kích hoạt thành công'
        });
    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kích hoạt 2FA'
        });
    }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã xác thực để tắt 2FA'
            });
        }
        
        // Get user's secret
        const { data: user } = await supabase
            .from('users')
            .select('two_factor_secret, two_factor_enabled')
            .eq('id', req.user.id)
            .single();
        
        if (!user || !user.two_factor_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA chưa được kích hoạt'
            });
        }
        
        // Verify token
        const isValid = twoFactorService.verifyToken(user.two_factor_secret, token);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Mã xác thực không đúng'
            });
        }
        
        // Disable 2FA
        await supabase
            .from('users')
            .update({
                two_factor_enabled: false,
                two_factor_secret: null
            })
            .eq('id', req.user.id);
        
        res.json({
            success: true,
            message: '2FA đã được tắt'
        });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tắt 2FA'
        });
    }
});

// Verify 2FA token during login
router.post('/2fa/verify', async (req, res) => {
    try {
        const { email, token } = req.body;
        
        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin'
            });
        }
        
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }
        
        if (!user.two_factor_enabled || !user.two_factor_secret) {
            return res.status(400).json({
                success: false,
                message: '2FA chưa được kích hoạt'
            });
        }
        
        // Verify token
        const isValid = twoFactorService.verifyToken(user.two_factor_secret, token);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Mã xác thực không đúng'
            });
        }
        
        // Generate JWT
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        
        setAuthCookie(res, jwtToken);
        res.json({
            success: true,
            message: 'Xác thực 2FA thành công',
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// Logout - xóa httpOnly cookie và blacklist token
router.post('/logout', (req, res) => {
    const { tokenBlacklist } = require('../middleware/auth');
    // Blacklist token hiện tại (từ cookie hoặc header)
    const token = req.cookies?.authToken ||
        (req.headers['authorization']?.split(' ')[1]);
    if (token) tokenBlacklist.add(token);

    res.clearCookie('authToken', { httpOnly: true, sameSite: 'strict' });
    res.json({ success: true, message: 'Đã đăng xuất' });
});

module.exports = router;
