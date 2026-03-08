const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/accounts');
const paymentRoutes = require('./routes/payment');

// Initialize app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Limit auth attempts
    message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection (optional - app works with localStorage)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
    console.log('⚠️  MongoDB not connected - Using localStorage mode');
    console.log('   App will work normally with browser storage');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/payment', paymentRoutes);

// Maintenance status endpoint (public)
app.get('/api/maintenance/status', (req, res) => {
    // Đọc từ file hoặc database (hiện tại dùng in-memory)
    // Trong production, nên lưu vào database
    const maintenanceData = global.maintenanceSettings || {
        enabled: false,
        message: 'Website đang bảo trì',
        eta: '30 phút',
        telegram: 'https://t.me/hanghoammo'
    };
    
    res.json({
        success: true,
        data: maintenanceData
    });
});

// Update maintenance settings (admin only - sẽ gọi từ admin panel)
app.post('/api/maintenance/update', (req, res) => {
    const { enabled, message, eta, telegram } = req.body;
    
    // Lưu vào global variable (trong production nên dùng database)
    global.maintenanceSettings = {
        enabled: enabled === true || enabled === 'true',
        message: message || 'Website đang bảo trì',
        eta: eta || '30 phút',
        telegram: telegram || 'https://t.me/hanghoammo',
        updatedAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: 'Cập nhật trạng thái bảo trì thành công',
        data: global.maintenanceSettings
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
});
