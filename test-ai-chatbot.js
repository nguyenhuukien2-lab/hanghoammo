const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Test basic setup
console.log('🤖 Testing AI Chatbot Setup...\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('- PORT:', process.env.PORT || '3001');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing');

// Test OpenAI import
try {
    const OpenAI = require('openai');
    console.log('- OpenAI Package: ✅ Imported successfully');
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log('- OpenAI Client: ✅ Initialized');
    } else {
        console.log('- OpenAI Client: ⚠️  API key not configured');
    }
} catch (error) {
    console.log('- OpenAI Package: ❌ Import failed:', error.message);
}

// Test Supabase connection
try {
    const supabase = require('./src/config/supabase');
    console.log('- Supabase: ✅ Connected');
} catch (error) {
    console.log('- Supabase: ❌ Connection failed:', error.message);
}

console.log('\n🚀 Starting test server...');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import AI chat routes
try {
    const aiChatRoutes = require('./src/routes/ai-chat');
    app.use('/api/ai-chat', aiChatRoutes);
    console.log('✅ AI Chat routes loaded');
} catch (error) {
    console.log('❌ Failed to load AI Chat routes:', error.message);
}

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'AI Chatbot test server is running!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /test - This test endpoint',
            'POST /api/ai-chat/message - Send message to AI',
            'GET /api/ai-chat/conversation/:id - Get conversation history',
            'GET /chatbot-demo.html - Demo page'
        ]
    });
});

// Test AI chat endpoint
app.post('/test-ai', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            return res.json({
                success: true,
                reply: 'Xin chào! Tôi là AI chatbot của HangHoaMMO. Hiện tại OpenAI API key chưa được cấu hình, nhưng tôi vẫn có thể trả lời với các phản hồi mẫu. Bạn cần hỗ trợ gì? 😊',
                fallback: true,
                note: 'OpenAI API key not configured - using fallback response'
            });
        }
        
        // If API key is configured, test actual OpenAI call
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là AI chatbot tư vấn sản phẩm cho HangHoaMMO. Trả lời ngắn gọn và thân thiện.'
                },
                {
                    role: 'user',
                    content: message || 'Xin chào'
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        });
        
        res.json({
            success: true,
            reply: completion.choices[0].message.content,
            model: 'gpt-3.5-turbo',
            note: 'Response from OpenAI API'
        });
        
    } catch (error) {
        console.error('Test AI error:', error);
        res.json({
            success: false,
            error: error.message,
            reply: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau! 😅'
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🤖 AI CHATBOT TEST SERVER          ║
╠═══════════════════════════════════════╣
║   Port: ${PORT}                        ║
║   Test: http://localhost:${PORT}/test  ║
║   Demo: http://localhost:${PORT}/chatbot-demo.html ║
╚═══════════════════════════════════════╝

📝 Test Commands:
curl http://localhost:${PORT}/test
curl -X POST http://localhost:${PORT}/test-ai -H "Content-Type: application/json" -d '{"message":"Xin chào"}'

🌐 Open in browser:
- http://localhost:${PORT}/chatbot-demo.html
- http://localhost:${PORT}/index.html
    `);
});

module.exports = app;