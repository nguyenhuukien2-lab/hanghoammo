// Test email sending
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
    console.log('Testing email service...');
    console.log('BREVO_API_KEY:', process.env.BREVO_SMTP_KEY ? '***configured***' : 'NOT SET');
    
    try {
        const result = await emailService.sendRegisterEmail(
            'Test User',
            'huukiennguyen711@gmail.com'
        );
        
        console.log('Result:', result);
        
        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.log('❌ Email failed:', result.message || result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEmail();
