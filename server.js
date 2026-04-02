const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const hpp = require('hpp');
const crypto = require('crypto');
require('dotenv').config();

// ── Validate required env vars on startup ──────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error('❌ Thiếu biến môi trường bắt buộc:', missing.join(', '));
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET quá ngắn, phải ít nhất 32 ký tự');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// ── WebSocket Real-time Chat ───────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws/chat' });
const chatClients = new Map(); // userId → ws

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) { ws.close(4001, 'Unauthorized'); return; }

    let userId, userRole;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        userRole = decoded.role || 'user';
    } catch { ws.close(4001, 'Invalid token'); return; }

    ws.userId = userId;
    ws.userRole = userRole;
    chatClients.set(userId, ws);

    ws.on('message', async (raw) => {
        try {
            const data = JSON.parse(raw);
            if (data.type !== 'message' || !data.message?.trim()) return;
            const { supabase } = require('./src/config/supabase');
            const isAdmin = userRole === 'admin';
            const insertData = isAdmin
                ? { user_id: data.target_user_id, sender_type: 'admin', message: data.message.trim(), is_read: false }
                : { user_id: userId, sender_type: 'user', message: data.message.trim(), is_read: false };
            const { data: saved, error } = await supabase.from('messages').insert(insertData).select().single();
            if (error) throw error;
            const payload = JSON.stringify({ type: 'message', data: saved });
            if (isAdmin) {
                const targetWs = chatClients.get(data.target_user_id);
                if (targetWs?.readyState === WebSocket.OPEN) targetWs.send(payload);
                ws.send(payload);
            } else {
                ws.send(payload);
                for (const [, client] of chatClients) {
                    if (client.userRole === 'admin' && client.readyState === WebSocket.OPEN) client.send(payload);
                }
            }
        } catch (err) { console.error('WS message error:', err); }
    });

    ws.on('close', () => chatClients.delete(userId));
    ws.on('error', (err) => console.error('WS error:', err));
});

app.locals.chatClients = chatClients;
app.locals.WebSocket = WebSocket;

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Security middleware - Helmet với CSP đầy đủ
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",   // cần cho inline scripts hiện tại
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://kit.fontawesome.com",
                "https://www.googletagmanager.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://ka-f.fontawesome.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https:",   // cho phép ảnh từ mọi HTTPS
            ],
            connectSrc: [
                "'self'",
                "https://wjqahsmislryiuqfmyux.supabase.co",
                "https://api.telegram.org"
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    message: { success: false, message: 'Quá nhiều request từ IP này. Vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 100 : 5,
    message: { success: false, message: 'Quá nhiều lần đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.' },
    skipSuccessfulRequests: true,
});

// Slow down brute force: sau 3 lần thất bại, mỗi request thêm 500ms delay
const authSlowDown = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: process.env.NODE_ENV === 'development' ? 50 : 3,
    delayMs: (used) => (used - 3) * 500, // tăng dần: 500ms, 1000ms, 1500ms...
    maxDelayMs: 10000,
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 50 : 3,
    message: { success: false, message: 'Quá nhiều lần yêu cầu OTP. Vui lòng thử lại sau 5 phút.' },
});

// Upload limiter - giới hạn riêng cho upload
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: process.env.NODE_ENV === 'development' ? 100 : 10,
    message: { success: false, message: 'Quá nhiều lần upload. Vui lòng thử lại sau.' },
});

// GZIP Compression
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Production: log chỉ errors và slow requests
    app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
    }));
}

// CORS - giới hạn domain được phép gọi API
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3001', 'http://localhost:3000'];

// Tự động thêm BASE_URL vào danh sách cho phép
if (process.env.BASE_URL && !allowedOrigins.includes(process.env.BASE_URL)) {
    allowedOrigins.push(process.env.BASE_URL);
}

app.use(cors({
    origin: function(origin, callback) {
        // Cho phép request không có origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        return callback(new Error('CORS không cho phép từ origin này'), false);
    },
    credentials: true,
    exposedHeaders: ['set-cookie']
}));
app.options('*', cors());

// Body parsers - giảm limit xuống hợp lý
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// HTTP Parameter Pollution protection
app.use(hpp());

// CSRF Protection - Double Submit Cookie Pattern
// Server tạo CSRF token, gửi qua cookie thường (JS đọc được)
// Frontend phải gửi lại qua header X-CSRF-Token
// Attacker không thể đọc cookie từ domain khác → an toàn
app.use((req, res, next) => {
    // Bỏ qua GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Tạo CSRF token nếu chưa có
        if (!req.cookies.csrfToken) {
            const csrfToken = crypto.randomBytes(32).toString('hex');
            res.cookie('csrfToken', csrfToken, {
                httpOnly: false, // JS cần đọc được để gửi lên header
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 1 ngày
            });
        }
        return next();
    }

    // Bỏ qua các route không cần CSRF (webhook, payment callback)
    const skipPaths = ['/api/payment/vnpay-return', '/api/payment/vnpay-ipn',
                       '/api/payment/momo-callback', '/api/payment/zalopay-callback',
                       '/api/telegram'];
    if (skipPaths.some(p => req.path.startsWith(p))) return next();

    // Kiểm tra CSRF token
    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token không hợp lệ'
        });
    }
    next();
});

// File upload middleware
const fileUpload = require('express-fileupload');
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    abortOnLimit: true,
    responseOnLimit: 'File quá lớn. Tối đa 5MB.'
}));

// Static files với cache 1 ngày (tối ưu tốc độ tải trang)
app.use(express.static('public', {
    maxAge: process.env.NODE_ENV === 'development' ? 0 : '1d',
    etag: true,
    setHeaders: (res) => {
        if (process.env.NODE_ENV === 'development') {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
    }
}));

// Also serve pages from the new pages directory
app.use(express.static('public/pages'));

// Maintenance status - đặt trước rate limiter để không bị chặn
const systemRoutes = require('./src/routes/system');
app.use('/api', systemRoutes);

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
const telegramRoutes = require('./src/routes/telegram');

// API Routes - auth với slow down chống brute force
app.use('/api/auth', authLimiter, authSlowDown, authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api', uploadLimiter, uploadRoutes);

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
app.use('/api/telegram', telegramRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server đang hoạt động',
        database: 'Supabase PostgreSQL',
        timestamp: new Date().toISOString()
    });
});

// Reset rate limit (development only)
app.post('/api/reset-rate-limit', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ khả dụng trong môi trường development'
        });
    }
    generalLimiter.resetKey(req.ip);
    authLimiter.resetKey(req.ip);
    otpLimiter.resetKey(req.ip);
    res.json({ success: true, message: 'Đã reset rate limit cho IP này' });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'products.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html'));
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
server.listen(PORT, () => {
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

    // Gửi thông báo server khởi động lên Telegram (1 lần duy nhất)
    if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
        const telegramService = require('./src/services/telegramService');
        setTimeout(() => {
            telegramService.sendWebsiteIntro()
                .then(() => console.log('✅ Đã gửi tin giới thiệu lên Telegram channel'))
                .catch(err => console.error('❌ Gửi Telegram thất bại:', err.message));
        }, 3000);
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
