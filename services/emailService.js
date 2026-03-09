// Email Service - Gửi email thông báo
// Sử dụng Brevo API (thay vì SMTP vì Render chặn port 587)

const https = require('https');

// Gửi email qua Brevo API
async function sendEmailViaBrevo(to, subject, html) {
    const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
    
    if (!apiKey) {
        throw new Error('BREVO_API_KEY not configured');
    }

    const data = JSON.stringify({
        sender: {
            name: "HangHoaMMO",
            email: "noreply@hanghoammo.com"
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
    });

    const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Email sent successfully via Brevo API');
                    const parsed = responseData ? JSON.parse(responseData) : {};
                    resolve({ success: true, messageId: parsed.messageId });
                } else {
                    console.error('❌ Brevo API error:', res.statusCode, responseData);
                    reject(new Error(`Brevo API error: ${res.statusCode} - ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Template email đăng ký
const registerEmailTemplate = (userName, userEmail) => {
    return {
        subject: '🎉 Chào mừng bạn đến với HangHoaMMO!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🛍️ HangHoaMMO</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Chợ MMO uy tín #1</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Xin chào ${userName}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Cảm ơn bạn đã đăng ký tài khoản tại <strong>HangHoaMMO</strong>. 
                        Chúng tôi rất vui được phục vụ bạn!
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #666;"><strong>Email:</strong> ${userEmail}</p>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Bạn có thể bắt đầu mua sắm ngay bây giờ. Nếu cần hỗ trợ, vui lòng liên hệ:
                    </p>
                    
                    <ul style="color: #666; line-height: 1.8;">
                        <li>📱 Telegram: <a href="https://t.me/hanghoammo">@hanghoammo</a></li>
                        <li>📞 Hotline: 0879.06.2222</li>
                        <li>🌐 Website: <a href="https://hanghoammo.onrender.com">hanghoammo.onrender.com</a></li>
                    </ul>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://hanghoammo.onrender.com/products.html" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; padding: 15px 40px; text-decoration: none; 
                                  border-radius: 25px; display: inline-block;">
                            🛒 Mua sắm ngay
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 HangHoaMMO. All rights reserved.</p>
                </div>
            </div>
        `
    };
};

// Template email đặt hàng thành công
const orderEmailTemplate = (userName, orderCode, orderTotal, orderItems, accounts) => {
    const itemsHtml = orderItems.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.product_price)}</td>
        </tr>
    `).join('');
    
    let accountsHtml = '';
    if (accounts && accounts.length > 0) {
        accountsHtml = `
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2e7d32; margin-top: 0;">🎁 Tài khoản của bạn:</h3>
                ${accounts.map(acc => `
                    <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
                        <p style="margin: 5px 0; color: #333;"><strong>${acc.product_name}</strong></p>
                        <p style="margin: 5px 0; color: #666;">Tài khoản: <code style="background: #f5f5f5; padding: 3px 8px; border-radius: 4px;">${acc.username}</code></p>
                        <p style="margin: 5px 0; color: #666;">Mật khẩu: <code style="background: #f5f5f5; padding: 3px 8px; border-radius: 4px;">${acc.password}</code></p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return {
        subject: `✅ Đơn hàng #${orderCode} đã được xác nhận`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">✅ Đặt hàng thành công!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Xin chào ${userName}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Đơn hàng <strong>#${orderCode}</strong> của bạn đã được xác nhận và thanh toán thành công.
                    </p>
                    
                    ${accountsHtml}
                    
                    <h3 style="color: #333; margin-top: 30px;">Chi tiết đơn hàng:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">SL</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                                <td style="padding: 15px; text-align: right; font-weight: bold; color: #667eea; font-size: 18px;">${formatPrice(orderTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Cảm ơn bạn đã mua hàng tại HangHoaMMO. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:
                    </p>
                    
                    <ul style="color: #666; line-height: 1.8;">
                        <li>📱 Telegram: <a href="https://t.me/hanghoammo">@hanghoammo</a></li>
                        <li>📞 Hotline: 0879.06.2222</li>
                    </ul>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 HangHoaMMO. All rights reserved.</p>
                </div>
            </div>
        `
    };
};

// Template email duyệt nạp tiền
const depositApprovedTemplate = (userName, amount, newBalance) => {
    return {
        subject: '✅ Yêu cầu nạp tiền đã được duyệt',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #26de81 0%, #20bf6b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">💰 Nạp tiền thành công!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Xin chào ${userName}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Yêu cầu nạp tiền của bạn đã được admin duyệt thành công.
                    </p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; color: #666; font-size: 14px;">Số tiền nạp</p>
                        <p style="margin: 10px 0; color: #2e7d32; font-size: 32px; font-weight: bold;">+${formatPrice(amount)}</p>
                        <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Số dư mới: <strong>${formatPrice(newBalance)}</strong></p>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Bạn có thể sử dụng số dư này để mua sắm ngay bây giờ!
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://hanghoammo.onrender.com/products.html" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; padding: 15px 40px; text-decoration: none; 
                                  border-radius: 25px; display: inline-block;">
                            🛒 Mua sắm ngay
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 HangHoaMMO. All rights reserved.</p>
                </div>
            </div>
        `
    };
};

// Helper function
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Gửi email
async function sendEmail(to, template) {
    try {
        return await sendEmailViaBrevo(to, template.subject, template.html);
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, error: error.message };
    }
}

// Export functions
module.exports = {
    sendRegisterEmail: (userName, userEmail) => {
        const template = registerEmailTemplate(userName, userEmail);
        return sendEmail(userEmail, template);
    },
    
    sendOrderEmail: (userEmail, userName, orderCode, orderTotal, orderItems, accounts = []) => {
        const template = orderEmailTemplate(userName, orderCode, orderTotal, orderItems, accounts);
        return sendEmail(userEmail, template);
    },
    
    sendDepositApprovedEmail: (userEmail, userName, amount, newBalance) => {
        const template = depositApprovedTemplate(userName, amount, newBalance);
        return sendEmail(userEmail, template);
    }
};
