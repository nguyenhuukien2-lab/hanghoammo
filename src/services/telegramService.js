// Telegram Bot Service - Gửi thông báo qua Telegram
const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8602357719:AAEuMFXaUyBICsbDFttf3KpdaCRvx1ybkKU';

// Chat ID nhóm admin - nhận TẤT CẢ thông báo đơn hàng, đăng ký, nạp tiền
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

// Gửi tin nhắn qua Telegram
async function sendTelegramMessage(chatId, message, options = {}) {
    if (!chatId) {
        console.log('⚠️ No Telegram chat_id provided, skipping notification');
        return { success: false, error: 'No chat_id' };
    }

    const payload = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
    });

    const requestOptions = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(requestOptions, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ Telegram sent to ${chatId}`);
                    resolve({ success: true, data: JSON.parse(responseData) });
                } else {
                    console.error(`❌ Telegram API error ${res.statusCode}:`, responseData);
                    reject(new Error(`Telegram API error: ${res.statusCode} - ${responseData}`));
                }
            });
        });
        req.on('error', (error) => {
            console.error('❌ Telegram request error:', error);
            reject(error);
        });
        req.write(payload);
        req.end();
    });
}

// Gửi đến nhiều nơi: nhóm admin + user (nếu có)
async function sendToAll(userChatId, message) {
    const promises = [];

    // Luôn gửi vào nhóm admin nếu đã cấu hình
    if (ADMIN_CHAT_ID) {
        promises.push(
            sendTelegramMessage(ADMIN_CHAT_ID, message).catch(err =>
                console.error('Failed to send to admin group:', err.message)
            )
        );
    } else {
        console.log('⚠️ TELEGRAM_ADMIN_CHAT_ID chưa được cấu hình trong .env');
    }

    // Gửi cho user nếu họ có chat_id
    if (userChatId && userChatId !== ADMIN_CHAT_ID) {
        promises.push(
            sendTelegramMessage(userChatId, message).catch(err =>
                console.error('Failed to send to user:', err.message)
            )
        );
    }

    await Promise.all(promises);
}

// Helper format tiền
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Template thông báo đăng ký
function getRegisterMessage(userName, userEmail) {
    return `🎉 <b>Người dùng mới đăng ký!</b>

👤 <b>Họ tên:</b> ${userName}
📧 <b>Email:</b> ${userEmail}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

🌐 Website: https://hanghoammo.onrender.com`;
}

// Template thông báo đặt hàng (gửi admin)
function getOrderAdminMessage(userName, userEmail, orderCode, orderTotal, orderItems) {
    const itemsList = orderItems.map(item =>
        `  • ${item.product_name || item.name} x${item.quantity} - ${formatPrice(item.product_price || item.price)}`
    ).join('\n');

    return `🛒 <b>ĐƠN HÀNG MỚI #${orderCode}</b>

👤 <b>Khách hàng:</b> ${userName}
📧 <b>Email:</b> ${userEmail || 'N/A'}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

📦 <b>Sản phẩm:</b>
${itemsList}

💰 <b>Tổng tiền:</b> ${formatPrice(orderTotal)}`;
}

// Template thông báo đặt hàng (gửi user)
function getOrderUserMessage(userName, orderCode, orderTotal, orderItems, accounts) {
    const itemsList = orderItems.map(item =>
        `  • ${item.product_name || item.name} x${item.quantity} - ${formatPrice(item.product_price || item.price)}`
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

    return `✅ <b>Đơn hàng #${orderCode} đã xác nhận!</b>

👤 <b>Khách hàng:</b> ${userName}

📦 <b>Chi tiết:</b>
${itemsList}

💰 <b>Tổng cộng:</b> ${formatPrice(orderTotal)}
${accountsList}

📱 Hỗ trợ: @hanghoammo | 📞 0879.06.2222`;
}

// Template thông báo nạp tiền
function getDepositMessage(userName, userEmail, amount, newBalance) {
    return `💰 <b>NẠP TIỀN MỚI</b>

👤 <b>Khách hàng:</b> ${userName}
📧 <b>Email:</b> ${userEmail || 'N/A'}
💵 <b>Số tiền:</b> +${formatPrice(amount)}
💳 <b>Số dư mới:</b> ${formatPrice(newBalance)}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;
}

module.exports = {
    sendTelegramMessage,

    // Thông báo đăng ký - gửi vào nhóm admin
    sendRegisterNotification: async (userChatId, userName, userEmail) => {
        try {
            const message = getRegisterMessage(userName, userEmail);
            await sendToAll(userChatId, message);
            return { success: true };
        } catch (error) {
            console.error('Failed to send register notification:', error);
            return { success: false, error: error.message };
        }
    },

    // Thông báo đặt hàng - gửi admin (đầy đủ) + user (có tài khoản)
    sendOrderNotification: async (userChatId, userName, orderCode, orderTotal, orderItems, accounts = [], userEmail = '') => {
        try {
            // Gửi vào nhóm admin
            if (ADMIN_CHAT_ID) {
                const adminMsg = getOrderAdminMessage(userName, userEmail, orderCode, orderTotal, orderItems);
                await sendTelegramMessage(ADMIN_CHAT_ID, adminMsg).catch(err =>
                    console.error('Failed to send order to admin group:', err.message)
                );
            } else {
                console.log('⚠️ TELEGRAM_ADMIN_CHAT_ID chưa cấu hình');
            }

            // Gửi cho user nếu có chat_id
            if (userChatId) {
                const userMsg = getOrderUserMessage(userName, orderCode, orderTotal, orderItems, accounts);
                await sendTelegramMessage(userChatId, userMsg).catch(err =>
                    console.error('Failed to send order to user:', err.message)
                );
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to send order notification:', error);
            return { success: false, error: error.message };
        }
    },

    // Thông báo nạp tiền - gửi vào nhóm admin + user
    // Gửi tin giới thiệu website vào channel (xoay vòng nhiều mẫu)
    sendWebsiteIntro: async () => {
        try {
            if (!ADMIN_CHAT_ID) {
                console.log('⚠️ TELEGRAM_ADMIN_CHAT_ID chưa cấu hình');
                return { success: false };
            }

            const templates = [
`╔══════════════════════════╗
║  🏪 HANGHOAMMO SHOP  ║
╚══════════════════════════╝

💥 <b>TÀI KHOẢN SỐ GIÁ RẺ - UY TÍN</b>

🎬 Netflix • Spotify • YouTube Premium
🤖 ChatGPT Plus • Canva Pro • Midjourney  
🔒 NordVPN • ExpressVPN
🎮 Steam • Game • Tài khoản các loại

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Giao hàng TỰ ĐỘNG 24/7</b>
💰 <b>Giá RẺ NHẤT thị trường</b>
🛡️ <b>Bảo hành ĐẦY ĐỦ - đổi mới nếu lỗi</b>
🎁 <b>Voucher giảm giá thường xuyên</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

🛒 <b>MUA NGAY:</b> https://hanghoammo.onrender.com
📞 Hotline: <b>0879.06.2222</b>
💬 Telegram: <b>@hanghoammo</b>`,

`🔥🔥🔥 <b>FLASH SALE HÀNG NGÀY</b> 🔥🔥🔥

👇 <b>SẢN PHẨM HOT NHẤT HÔM NAY</b> 👇

🥇 Netflix Premium 4K — <b>chỉ từ 45k/tháng</b>
🥈 Spotify Premium — <b>chỉ từ 35k/tháng</b>
🥉 ChatGPT Plus — <b>chỉ từ 120k/tháng</b>
🏅 Canva Pro — <b>chỉ từ 80k/tháng</b>
🏅 NordVPN — <b>chỉ từ 50k/tháng</b>

✅ Nhận hàng <b>NGAY LẬP TỨC</b> sau thanh toán
✅ Bảo hành <b>1 THÁNG</b> - đổi mới nếu lỗi
✅ Hỗ trợ <b>24/7</b> - phản hồi trong 5 phút

🛒 <b>ĐẶT HÀNG NGAY:</b>
👉 https://hanghoammo.onrender.com

📱 <b>@hanghoammo</b> | ☎️ <b>0879.06.2222</b>`,

`💎 <b>VÌ SAO NÊN CHỌN HANGHOAMMO?</b> 💎

🏆 <b>Uy tín #1</b> - Hàng nghìn khách hàng tin dùng
⚡ <b>Tự động 24/7</b> - Không cần chờ đợi
💸 <b>Giá tốt nhất</b> - Cam kết hoàn tiền nếu rẻ hơn
🔄 <b>Bảo hành</b> - Đổi mới ngay nếu có vấn đề
🎁 <b>Tích điểm</b> - Mua nhiều giảm nhiều
👥 <b>Affiliate</b> - Giới thiệu bạn bè kiếm thêm thu nhập

━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>DANH MỤC SẢN PHẨM:</b>
🎬 Giải trí  |  🤖 AI Tools  |  🔒 VPN
🎮 Game  |  📱 Social  |  💼 Công cụ
━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 https://hanghoammo.onrender.com
💬 @hanghoammo  |  📞 0879.06.2222`,

`⏰ <b>THÔNG BÁO ${new Date().toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}</b> - HANGHOAMMO

🛍️ <b>Hàng có sẵn - Giao ngay!</b>

┌─────────────────────────┐
│ 🎬 GIẢI TRÍ             │
│  • Netflix 4K: 45k-85k  │
│  • Spotify: 35k-60k     │
│  • YouTube: 55k/tháng   │
├─────────────────────────┤
│ 🤖 AI & CÔNG CỤ         │
│  • ChatGPT Plus: 120k   │
│  • Canva Pro: 80k       │
│  • Midjourney: 150k     │
├─────────────────────────┤
│ 🔒 VPN & BẢO MẬT        │
│  • NordVPN: 50k-100k    │
│  • ExpressVPN: 80k      │
└─────────────────────────┘

💳 Thanh toán: Ví nội bộ | Chuyển khoản
🛒 https://hanghoammo.onrender.com`
            ];

            // Xoay vòng template theo thời gian
            const idx = Math.floor(Date.now() / (5 * 60 * 1000)) % templates.length;
            return await sendTelegramMessage(ADMIN_CHAT_ID, templates[idx]);
        } catch (error) {
            console.error('Failed to send website intro:', error);
            return { success: false, error: error.message };
        }
    },

    // Gửi thông báo sản phẩm mới vào channel
    sendNewProduct: async (productName, productPrice, productDesc, productCategory) => {
        try {
            if (!ADMIN_CHAT_ID) return { success: false };
            const message =
`🆕 <b>SẢN PHẨM MỚI VỪA CẬP NHẬT!</b>

🏷️ <b>${productName}</b>
💰 <b>Giá:</b> ${formatPrice(productPrice)}
📂 <b>Danh mục:</b> ${productCategory}
📝 ${productDesc}

⚡ Giao hàng tự động ngay sau thanh toán!

🛒 Mua ngay: https://hanghoammo.onrender.com/products.html
📱 Liên hệ: @hanghoammo`;
            return await sendTelegramMessage(ADMIN_CHAT_ID, message);
        } catch (error) {
            console.error('Failed to send new product notification:', error);
            return { success: false, error: error.message };
        }
    },

    // Gửi chào mừng kèm link nhóm cho khách mới đăng ký
    sendWelcomeWithGroupLink: async (userChatId, userName) => {
        try {
            const groupLink = process.env.TELEGRAM_GROUP_LINK || '';
            if (!groupLink) return;
            const message = `🎉 <b>Chào mừng ${userName} đến với HangHoaMMO!</b>\n\n` +
                `Tham gia nhóm Telegram để:\n` +
                `  • Nhận thông báo đơn hàng realtime\n` +
                `  • Cập nhật sản phẩm mới nhất\n` +
                `  • Hỗ trợ 24/7\n\n` +
                `👉 <a href="${groupLink}">Nhấn vào đây để tham gia nhóm</a>\n\n` +
                `🛒 Mua sắm: https://hanghoammo.onrender.com`;
            return await sendTelegramMessage(userChatId, message);
        } catch (error) {
            console.error('Failed to send welcome with group link:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports.sendTelegramMessage = sendTelegramMessage;
