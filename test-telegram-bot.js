// Test Telegram Bot Connection
require('dotenv').config();
const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN chưa được set trong .env');
    process.exit(1);
}

// Test getMe API
function testBot() {
    const path = `/bot${BOT_TOKEN}/getMe`;
    
    https.get(`https://api.telegram.org${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.ok) {
                    console.log('✅ Bot connected successfully!');
                    console.log('Bot info:', result.result);
                    console.log('\nBot username:', '@' + result.result.username);
                    console.log('Bot name:', result.result.first_name);
                } else {
                    console.log('❌ Bot connection failed:', result);
                }
            } catch (e) {
                console.error('❌ Error parsing response:', e);
            }
        });
    }).on('error', (e) => {
        console.error('❌ Connection error:', e.message);
    });
}

testBot();
