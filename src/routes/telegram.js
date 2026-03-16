const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');

// Gửi tin giới thiệu website lên Telegram channel (admin only)
router.post('/send-intro', async (req, res) => {
    try {
        await telegramService.sendWebsiteIntro();
        res.json({ success: true, message: 'Đã gửi tin giới thiệu lên channel!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Gửi bản tin MMO thủ công (admin only)
router.post('/send-news', async (req, res) => {
    try {
        const { runNewsSession } = require('../../scripts/mmo-news-bot');
        await runNewsSession('Thủ Công');
        res.json({ success: true, message: 'Đã gửi bản tin MMO!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Trạng thái MMO News Bot
router.get('/news-bot-status', (req, res) => {
    res.json({
        success: true,
        enabled: process.env.MMO_NEWS_BOT_ENABLED === 'true',
        schedule: '8:00, 12:00, 20:00 (giờ VN)'
    });
});

// Gửi thông báo sản phẩm mới lên channel (admin only)
router.post('/send-product', async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        await telegramService.sendNewProduct(name, price, description, category);
        res.json({ success: true, message: 'Đã gửi thông báo sản phẩm mới!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
