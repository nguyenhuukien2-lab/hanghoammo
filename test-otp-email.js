// Test OTP email
require('dotenv').config();
const emailService = require('./services/emailService');

async function testOTPEmail() {
    console.log('Testing OTP email...');
    console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '***configured***' : 'NOT SET');
    
    const testOTP = '123456';
    
    try {
        const result = await emailService.sendPasswordOTPEmail(
            'Nguyễn Hữu Kiên',
            'huukiennguyen711@gmail.com',
            testOTP
        );
        
        console.log('Result:', result);
        
        if (result.success) {
            console.log('✅ OTP email sent successfully!');
            console.log('Message ID:', result.messageId);
            console.log('Test OTP:', testOTP);
        } else {
            console.log('❌ Email failed:', result.message || result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testOTPEmail();
