// Test password changed email
require('dotenv').config();
const emailService = require('./services/emailService');

async function testPasswordChangedEmail() {
    console.log('Testing password changed email...');
    console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '***configured***' : 'NOT SET');
    
    try {
        const result = await emailService.sendPasswordChangedEmail(
            'Nguyễn Hữu Kiên',
            'huukiennguyen711@gmail.com'
        );
        
        console.log('Result:', result);
        
        if (result.success) {
            console.log('✅ Password changed email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.log('❌ Email failed:', result.message || result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPasswordChangedEmail();
