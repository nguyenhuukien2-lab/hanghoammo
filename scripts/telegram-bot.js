// Telegram Bot Handler - Xử lý tin nhắn từ khách hàng
require('dotenv').config();
const https = require('https');
const db = require('./config/database');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8602357719:AAEuMFXaUyBICsbDFttf3KpdaCRvx1ybkKU';
let lastUpdateId = 0;

// Gửi tin nhắn
async function sendMessage(chatId, text, options = {}) {
    const data = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
    });

    const requestOptions = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(requestOptions, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(responseData));
                } else {
                    reject(new Error(`API error: ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Lấy updates từ Telegram
async function getUpdates(offset = 0) {
    return new Promise((resolve, reject) => {
        const path = `/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
        
        https.get(`https://api.telegram.org${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Xử lý lệnh /start
async function handleStart(chatId, firstName) {
    const message = `🎉 <b>Chào mừng ${firstName} đến với HangHoaMMO!</b>

Để nhận thông báo tự động khi:
• Đăng ký tài khoản
• Đặt hàng thành công
• Nạp tiền được duyệt

<b>Bước 1:</b> Copy Chat ID của bạn:
<code>${chatId}</code>

<b>Bước 2:</b> Vào website và nhập Chat ID này vào trang Profile

🌐 <b>Website:</b> https://hanghoammo.onrender.com
📱 <b>Hỗ trợ:</b> @hanghoammo
📞 <b>Hotline:</b> 0879.06.2222`;

    await sendMessage(chatId, message);
}

// Xử lý lệnh /help
async function handleHelp(chatId) {
    const message = `📖 <b>Hướng dẫn sử dụng Bot</b>

<b>Các lệnh:</b>
/start - Bắt đầu và lấy Chat ID
/help - Xem hướng dẫn
/chatid - Xem Chat ID của bạn

<b>Chat ID của bạn:</b>
<code>${chatId}</code>

Nhập Chat ID này vào website để nhận thông báo tự động!`;

    await sendMessage(chatId, message);
}

// Xử lý lệnh /chatid
async function handleChatId(chatId) {
    const message = `🆔 <b>Chat ID của bạn:</b>

<code>${chatId}</code>

Copy và nhập vào trang Profile trên website để nhận thông báo!`;

    await sendMessage(chatId, message);
}

// Xử lý tin nhắn
async function handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text || '';
    const firstName = message.from.first_name || 'bạn';

    console.log(`📩 Message from ${firstName} (${chatId}): ${text}`);

    if (text.startsWith('/start')) {
        await handleStart(chatId, firstName);
    } else if (text.startsWith('/help')) {
        await handleHelp(chatId);
    } else if (text.startsWith('/chatid')) {
        await handleChatId(chatId);
    } else {
        // Tin nhắn thường
        await sendMessage(chatId, 
            `Xin chào! Gửi /start để bắt đầu hoặc /help để xem hướng dẫn.`
        );
    }
}

// Polling loop
async function startBot() {
    console.log('🤖 Telegram Bot started!');
    console.log('Bot: @hanghoammo_shop_bot');
    console.log('Waiting for messages...\n');

    while (true) {
        try {
            const response = await getUpdates(lastUpdateId + 1);
            
            if (response.ok && response.result.length > 0) {
                for (const update of response.result) {
                    lastUpdateId = update.update_id;
                    
                    if (update.message) {
                        await handleMessage(update.message);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Start bot
startBot().catch(console.error);
