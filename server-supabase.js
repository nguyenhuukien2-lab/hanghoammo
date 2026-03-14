const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for now to allow inline scripts
    crossOriginEmbedderPolicy: false
}));

// Rate limiting - TẠM THỜI TẮT KHI TEST
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Rất cao khi development
    message: {
        success: false,
        message: 'Quá nhiều request từ IP này. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development', // Bỏ qua hoàn toàn khi development
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 10000 : 5, // Rất cao khi development
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.'
    },
    skipSuccessfulRequests: true,
    skip: () => process.env.NODE_ENV === 'development', // Bỏ qua hoàn toàn khi development
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: process.env.NODE_ENV === 'development' ? 10000 : 3, // Rất cao khi development
    message: {
        success: false,
        message: 'Quá nhiều lần yêu cầu OTP. Vui lòng thử lại sau 5 phút.'
    },
    skip: () => process.env.NODE_ENV === 'development', // Bỏ qua hoàn toàn khi development
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle OPTIONS requests for CORS
app.options('*', cors());

// File upload middleware
const fileUpload = require('express-fileupload');
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    abortOnLimit: true,
    responseOnLimit: 'File quá lớn. Tối đa 5MB.'
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Import routes
const authRoutes = require('./src/routes/auth');
const productsRoutes = require('./src/routes/products');
const walletRoutes = require('./src/routes/wallet');
const adminRoutes = require('./src/routes/admin');
const setupRoutes = require('./src/routes/setup');
const ordersRoutes = require('./src/routes/orders');
const chatRoutes = require('./src/routes/chat');
const aiChatRoutes = require('./src/routes/ai-chat');
const uploadRoutes = require('./src/routes/upload');

// New feature routes
const paymentRoutes = require('./src/routes/payment');
const reviewsRoutes = require('./src/routes/reviews');
const wishlistRoutes = require('./src/routes/wishlist');
const vouchersRoutes = require('./src/routes/vouchers');
const affiliateRoutes = require('./src/routes/affiliate');
const blogRoutes = require('./src/routes/blog');
const analyticsRoutes = require('./src/routes/analytics');
const resellerRoutes = require('./src/routes/reseller');
const stockRoutes = require('./src/routes/stock');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api', uploadRoutes);

// New feature routes
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/vouchers', vouchersRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reseller', resellerRoutes);
app.use('/api/stock', stockRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server đang hoạt động',
        database: 'Supabase PostgreSQL',
        timestamp: new Date().toISOString()
    });
});

// Gửi tin giới thiệu website lên Telegram channel (admin only)
app.post('/api/telegram/send-intro', async (req, res) => {
    try {
        const telegramService = require('./src/services/telegramService');
        await telegramService.sendWebsiteIntro();
        res.json({ success: true, message: 'Đã gửi tin giới thiệu lên channel!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Gửi thông báo sản phẩm mới lên channel (admin only)
app.post('/api/telegram/send-product', async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        const telegramService = require('./src/services/telegramService');
        await telegramService.sendNewProduct(name, price, description, category);
        res.json({ success: true, message: 'Đã gửi thông báo sản phẩm mới!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reset rate limit (development only)
app.post('/api/reset-rate-limit', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ khả dụng trong môi trường development'
        });
    }
    
    // Reset rate limiters
    generalLimiter.resetKey(req.ip);
    authLimiter.resetKey(req.ip);
    otpLimiter.resetKey(req.ip);
    
    res.json({
        success: true,
        message: 'Đã reset rate limit cho IP này'
    });
});

// Maintenance API (giữ nguyên)
let maintenanceSettings = {
    enabled: false,
    message: 'Website đang bảo trì',
    eta: '30 phút',
    telegram: 'https://t.me/hanghoammo'
};

app.get('/api/maintenance/status', (req, res) => {
    res.json({
        success: true,
        data: maintenanceSettings
    });
});

app.post('/api/maintenance/update', (req, res) => {
    const { enabled, message, eta, telegram } = req.body;
    
    maintenanceSettings = {
        enabled: enabled !== undefined ? enabled : maintenanceSettings.enabled,
        message: message || maintenanceSettings.message,
        eta: eta || maintenanceSettings.eta,
        telegram: telegram || maintenanceSettings.telegram
    };
    
    res.json({
        success: true,
        message: 'Cập nhật cài đặt bảo trì thành công',
        data: maintenanceSettings
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint không tồn tại'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🚀 HANGHOAMMO SERVER STARTED       ║
╠═══════════════════════════════════════╣
║   Port: ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}        ║
║   Database: Supabase PostgreSQL       ║
║   Frontend: http://localhost:${PORT}  ║
║   Admin: http://localhost:${PORT}/admin ║
╚═══════════════════════════════════════╝
    `);

    // Tự động gửi tin giới thiệu website lên Telegram channel khi server khởi động
    if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
        const telegramService = require('./src/services/telegramService');

        // Gửi ngay lần đầu sau 3 giây
        setTimeout(() => {
            telegramService.sendWebsiteIntro()
                .then(() => console.log('✅ Đã gửi tin giới thiệu lên Telegram channel'))
                .catch(err => console.error('❌ Gửi Telegram thất bại:', err.message));
        }, 3000);

        // Lặp lại mỗi 5 phút
        setInterval(() => {
            telegramService.sendWebsiteIntro()
                .then(() => console.log('✅ Telegram auto-post gửi thành công'))
                .catch(err => console.error('❌ Telegram auto-post thất bại:', err.message));
        }, 5 * 60 * 1000); // 5 phút

        console.log('🤖 Telegram auto-post: BẬT (mỗi 5 phút)');
    }

    // Khởi động MMO News Bot nếu bật
    if (process.env.MMO_NEWS_BOT_ENABLED === 'true' && process.env.TELEGRAM_ADMIN_CHAT_ID) {
        try {
            const { startBot } = require('./scripts/mmo-news-bot');
            startBot().catch(err => console.error('❌ MMO News Bot lỗi:', err.message));
            console.log('📰 MMO News Bot: BẬT (tự động 8:00, 12:00, 20:00 hàng ngày)');
        } catch (e) {
            console.error('❌ Không khởi động được MMO News Bot:', e.message);
        }
    }
});

module.exports = app;
