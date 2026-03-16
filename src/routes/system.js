const express = require('express');
const router = express.Router();

// Maintenance API
let maintenanceSettings = {
    enabled: false,
    message: 'Website đang bảo trì',
    eta: '30 phút',
    telegram: 'https://t.me/hanghoammo'
};

router.get('/maintenance/status', (req, res) => {
    res.json({
        success: true,
        data: maintenanceSettings
    });
});

router.post('/maintenance/update', (req, res) => {
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

module.exports = router;
