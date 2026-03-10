// Test Telegram Bot
require('dotenv').config();
const telegramService = require('./services/telegramService');

async function testTelegram() {
    console.log('Testing Telegram Bot...');
    
    // Thay YOUR_CHAT_ID bằng chat_id thật của bạn
    // Để lấy chat_id: Mở bot @hanghoammo_shop_bot → Gửi /start
    // Sau đó vào: https://api.telegram.org/bot8602357719:AAEuMFXaUyBICsbDFttf3KpdaCRvx1ybkKU/getUpdates
    
    const TEST_CHAT_ID = '6649932330'; // Chat ID của bạn
    
    try {
        const result = await telegramService.sendRegisterNotification(
            TEST_CHAT_ID,
            'Test User',
            'test@example.com'
        );
        
        console.log('Result:', result);
        
        if (result.success) {
            console.log('✅ Telegram notification sent successfully!');
        } else {
            console.log('❌ Failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testTelegram();
