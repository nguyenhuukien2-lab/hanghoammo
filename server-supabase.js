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

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Quá nhiều request từ IP này. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login/register requests per windowMs
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 OTP requests per 5 minutes
    message: {
        success: false,
        message: 'Quá nhiều lần yêu cầu OTP. Vui lòng thử lại sau 5 phút.'
    },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup');
const ordersRoutes = require('./routes/orders');

// API Routes with specific rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/request-password-otp', otpLimiter);
app.use('/api/auth/request-forgot-password-otp', otpLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/orders', ordersRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server đang hoạt động',
        database: 'Supabase PostgreSQL',
        timestamp: new Date().toISOString()
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
});

module.exports = app;
