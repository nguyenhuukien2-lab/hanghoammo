// Telegram Bot Service - Gửi thông báo qua Telegram
const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8602357719:AAEuMFXaUyBICsbDFttf3KpdaCRvx1ybkKU';

// Gửi tin nhắn qua Telegram
async function sendTelegramMessage(chatId, message, options = {}) {
    if (!chatId) {
        console.log('⚠️ No Telegram chat_id provided, skipping notification');
        return { success: false, error: 'No chat_id' };
    }

    const data = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: options.disablePreview || false,
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

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Telegram message sent successfully');
                    resolve({ success: true, data: JSON.parse(responseData) });
                } else {
                    console.error('❌ Telegram API error:', res.statusCode, responseData);
                    reject(new Error(`Telegram API error: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Telegram request error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Template thông báo đăng ký
function getRegisterMessage(userName, userEmail) {
    return `🎉 <b>Chào mừng bạn đến với HangHoaMMO!</b>

👤 <b>Họ tên:</b> ${userName}
📧 <b>Email:</b> ${userEmail}

Cảm ơn bạn đã đăng ký tài khoản! Bạn có thể bắt đầu mua sắm ngay bây giờ.

🌐 <b>Website:</b> https://hanghoammo.onrender.com
📱 <b>Telegram:</b> @hanghoammo
📞 <b>Hotline:</b> 0879.06.2222`;
}

// Template thông báo đặt hàng
function getOrderMessage(userName, orderCode, orderTotal, orderItems, accounts) {
    let itemsList = orderItems.map(item => 
        `  • ${item.product_name} x${item.quantity} - ${formatPrice(item.product_price)}`
    ).join('\n');

    let accountsList = '';
    if (accounts && accounts.length > 0) {
        accountsList = '\n\n🎁 <b>Tài khoản của bạn:</b>\n\n';
        accountsList += accounts.map(acc => 
            `<b>${acc.product_name}</b>\n` +
            `  👤 Tài khoản: <code>${acc.username}</code>\n` +
            `  🔑 Mật khẩu: <code>${acc.password}</code>`
        ).join('\n\n');
    }

    return `✅ <b>Đơn hàng #${orderCode} đã được xác nhận!</b>

👤 <b>Khách hàng:</b> ${userName}

📦 <b>Chi tiết đơn hàng:</b>
${itemsList}

💰 <b>Tổng cộng:</b> ${formatPrice(orderTotal)}
${accountsList}

Cảm ơn bạn đã mua hàng tại HangHoaMMO!

📱 Hỗ trợ: @hanghoammo
📞 Hotline: 0879.06.2222`;
}

// Template thông báo nạp tiền
function getDepositApprovedMessage(userName, amount, newBalance) {
    return `💰 <b>Nạp tiền thành công!</b>

👤 <b>Khách hàng:</b> ${userName}
💵 <b>Số tiền nạp:</b> +${formatPrice(amount)}
💳 <b>Số dư mới:</b> ${formatPrice(newBalance)}

Bạn có thể sử dụng số dư này để mua sắm ngay bây giờ!

🛒 <b>Mua sắm:</b> https://hanghoammo.onrender.com/products.html`;
}

// Helper function
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Export functions
module.exports = {
    sendRegisterNotification: async (chatId, userName, userEmail) => {
        try {
            const message = getRegisterMessage(userName, userEmail);
            return await sendTelegramMessage(chatId, message);
        } catch (error) {
            console.error('Failed to send Telegram register notification:', error);
            return { success: false, error: error.message };
        }
    },

    sendOrderNotification: async (chatId, userName, orderCode, orderTotal, orderItems, accounts = []) => {
        try {
            const message = getOrderMessage(userName, orderCode, orderTotal, orderItems, accounts);
            return await sendTelegramMessage(chatId, message);
        } catch (error) {
            console.error('Failed to send Telegram order notification:', error);
            return { success: false, error: error.message };
        }
    },

    sendDepositApprovedNotification: async (chatId, userName, amount, newBalance) => {
        try {
            const message = getDepositApprovedMessage(userName, amount, newBalance);
            return await sendTelegramMessage(chatId, message);
        } catch (error) {
            console.error('Failed to send Telegram deposit notification:', error);
            return { success: false, error: error.message };
        }
    }
};
