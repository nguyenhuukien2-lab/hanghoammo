const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

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
