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
            email: "huukiennguyen711@gmail.com"
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        tags: ["hanghoammo"]
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

// Template email OTP đổi mật khẩu
const passwordOTPTemplate = (userName, userEmail, otp) => {
    return {
        subject: '🔐 Mã xác nhận đổi mật khẩu - HangHoaMMO',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🔐 Mã xác nhận OTP</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Xin chào ${userName}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Bạn đã yêu cầu đổi mật khẩu tài khoản. Vui lòng sử dụng mã OTP bên dưới để xác nhận:
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
                        <p style="color: white; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Mã OTP của bạn</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                        </div>
                        <p style="color: white; margin: 15px 0 0 0; font-size: 13px;">
                            <i class="fas fa-clock"></i> Mã có hiệu lực trong <strong>5 phút</strong>
                        </p>
                    </div>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                        <p style="margin: 0; color: #e65100;">
                            <strong>⚠️ Lưu ý bảo mật:</strong>
                        </p>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #666;">
                            <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
                            <li>HangHoaMMO sẽ không bao giờ yêu cầu mã OTP qua điện thoại</li>
                            <li>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này</li>
                        </ul>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #666;"><strong>Thông tin yêu cầu:</strong></p>
                        <p style="margin: 10px 0 0 0; color: #666;">Email: ${userEmail}</p>
                        <p style="margin: 5px 0 0 0; color: #666;">Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Nếu cần hỗ trợ, vui lòng liên hệ:
                    </p>
                    
                    <ul style="color: #666; line-height: 1.8;">
                        <li>📱 Telegram: <a href="https://t.me/hanghoammo">@hanghoammo</a></li>
                        <li>📞 Hotline: 0879.06.2222</li>
                        <li>🌐 Website: <a href="https://hanghoammo.onrender.com">hanghoammo.onrender.com</a></li>
                    </ul>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 HangHoaMMO. All rights reserved.</p>
                    <p style="margin-top: 10px;">Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            </div>
        `
    };
};

// Template email đổi mật khẩu thành công
const passwordChangedTemplate = (userName, userEmail) => {
    return {
        subject: '🔒 Mật khẩu đã được thay đổi - HangHoaMMO',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🔒 Mật khẩu đã thay đổi</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Xin chào ${userName}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc <strong>${new Date().toLocaleString('vi-VN')}</strong>.
                    </p>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                        <p style="margin: 0; color: #e65100;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Lưu ý bảo mật:</strong>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #666;">
                            Nếu bạn KHÔNG thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi để bảo vệ tài khoản.
                        </p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #666;"><strong>Thông tin tài khoản:</strong></p>
                        <p style="margin: 10px 0 0 0; color: #666;">Email: ${userEmail}</p>
                        <p style="margin: 5px 0 0 0; color: #666;">Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Để bảo vệ tài khoản của bạn:
                    </p>
                    
                    <ul style="color: #666; line-height: 1.8;">
                        <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
                        <li>Sử dụng mật khẩu mạnh và khác nhau cho mỗi tài khoản</li>
                        <li>Đăng xuất khỏi các thiết bị không sử dụng</li>
                        <li>Cập nhật Telegram Chat ID để nhận thông báo bảo mật</li>
                    </ul>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Nếu cần hỗ trợ, vui lòng liên hệ:
                    </p>
                    
                    <ul style="color: #666; line-height: 1.8;">
                        <li>📱 Telegram: <a href="https://t.me/hanghoammo">@hanghoammo</a></li>
                        <li>📞 Hotline: 0879.06.2222</li>
                        <li>🌐 Website: <a href="https://hanghoammo.onrender.com">hanghoammo.onrender.com</a></li>
                    </ul>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 HangHoaMMO. All rights reserved.</p>
                    <p style="margin-top: 10px;">Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            </div>
        `
    };
};

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
    },
    
    sendPasswordChangedEmail: (userName, userEmail) => {
        const template = passwordChangedTemplate(userName, userEmail);
        return sendEmail(userEmail, template);
    },
    
    sendPasswordOTPEmail: (userName, userEmail, otp) => {
        const template = passwordOTPTemplate(userName, userEmail, otp);
        return sendEmail(userEmail, template);
    }
};
