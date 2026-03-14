const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { supabase } = require('../config/supabase');

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

// Get products for AI context
async function getProductsContext() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('name, price, description, category, image')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) throw error;
        
        // Group products by category for better context
        const productsByCategory = {};
        (products || []).forEach(product => {
            if (!productsByCategory[product.category]) {
                productsByCategory[product.category] = [];
            }
            productsByCategory[product.category].push(product);
        });
        
        return products || [];
    } catch (error) {
        console.error('Error getting products:', error);
        // Return mock products if database fails
        return [
            { name: 'Netflix Premium 4K', price: 65000, description: 'Xem phim 4K không giới hạn, 4 màn hình', category: 'entertainment', stock: 50 },
            { name: 'Spotify Premium', price: 45000, description: 'Nghe nhạc không quảng cáo, chất lượng cao', category: 'entertainment', stock: 30 },
            { name: 'ChatGPT Plus', price: 150000, description: 'AI thông minh, không giới hạn câu hỏi', category: 'ai', stock: 20 },
            { name: 'Canva Pro', price: 90000, description: 'Thiết kế chuyên nghiệp, templates premium', category: 'design', stock: 25 },
            { name: 'NordVPN Premium', price: 80000, description: 'VPN tốc độ cao, bảo mật tuyệt đối', category: 'vpn', stock: 15 },
            { name: 'YouTube Premium', price: 55000, description: 'Xem video không quảng cáo, tải offline', category: 'entertainment', stock: 40 }
        ];
    }
}

// AI Chat endpoint
router.post('/message', async (req, res) => {
    try {
        const { message, conversation_id } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tin nhắn'
            });
        }

        // Get products for context
        const products = await getProductsContext();
        
        // Create system prompt with product information
        const systemPrompt = `Bạn là AI chatbot tư vấn sản phẩm cho website HangHoaMmo - chuyên bán tài khoản game và dịch vụ số.

THÔNG TIN SẢN PHẨM HIỆN CÓ:
${products.map(p => `- ${p.name}: ${p.price.toLocaleString()}đ (${p.description}) - Danh mục: ${p.category} - Còn lại: ${p.stock}`).join('\n')}

NHIỆM VỤ CỦA BẠN:
1. Tư vấn sản phẩm phù hợp với nhu cầu khách hàng
2. Trả lời câu hỏi về sản phẩm, giá cả, tính năng
3. Hướng dẫn quy trình mua hàng
4. Hỗ trợ khách hàng 24/7

QUY TẮC QUAN TRỌNG:
- LUÔN đưa ra thông tin sản phẩm CỤ THỂ khi khách hàng hỏi
- LUÔN hiển thị GIÁ CẢ rõ ràng
- Gợi ý 2-3 sản phẩm phù hợp nhất
- Giải thích tại sao sản phẩm phù hợp với nhu cầu
- Đưa ra so sánh giữa các sản phẩm nếu có nhiều lựa chọn
- Thông báo tình trạng còn hàng

CÁCH TRẢ LỜI KHI KHÁCH HỎI VỀ SẢN PHẨM:
1. Chào hỏi thân thiện
2. Liệt kê 2-3 sản phẩm phù hợp với TÊN + GIÁ + MÔ TẢ
3. Giải thích ưu điểm của từng sản phẩm
4. Hỏi khách muốn biết thêm chi tiết gì

VÍ DỤ TRẢ LỜI TỐT:
"Chào bạn! Tôi có một số gợi ý tuyệt vời cho bạn:

🎬 **Netflix Premium** - 45.000đ/tháng
- Xem 4K, không quảng cáo
- 4 màn hình cùng lúc
- Thư viện phim đầy đủ

🎵 **Spotify Premium** - 35.000đ/tháng  
- Nghe nhạc không giới hạn
- Chất lượng cao 320kbps
- Tải về offline

Bạn quan tâm loại nào hơn? Tôi có thể tư vấn chi tiết hơn! 😊"

LUÔN sử dụng emoji và format đẹp để dễ đọc.`;

        // Prepare conversation history
        let conversationHistory = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ];

        // Get previous conversation if conversation_id exists
        if (conversation_id) {
            try {
                const { data: history } = await supabase
                    .from('ai_conversations')
                    .select('messages')
                    .eq('id', conversation_id)
                    .single();
                
                if (history && history.messages) {
                    conversationHistory = [
                        { role: 'system', content: systemPrompt },
                        ...history.messages,
                        { role: 'user', content: message }
                    ];
                }
            } catch (error) {
                console.log('No previous conversation found');
            }
        }

        // Call OpenAI API
        if (!openai) {
            return res.status(503).json({
                success: false,
                message: 'AI Chatbot hiện không khả dụng. Vui lòng liên hệ admin qua Telegram hoặc email.'
            });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationHistory,
            max_tokens: 500,
            temperature: 0.7
        });

        const aiReply = completion.choices[0].message.content;

        // Save conversation to database
        const newConversationHistory = [
            ...conversationHistory.slice(1), // Remove system prompt
            { role: 'assistant', content: aiReply }
        ];

        let savedConversationId = conversation_id;
        
        if (!conversation_id) {
            // Create new conversation
            const { data: newConv, error: convError } = await supabase
                .from('ai_conversations')
                .insert({
                    messages: newConversationHistory,
                    last_message: aiReply,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();
            
            if (!convError && newConv) {
                savedConversationId = newConv.id;
            }
        } else {
            // Update existing conversation
            await supabase
                .from('ai_conversations')
                .update({
                    messages: newConversationHistory,
                    last_message: aiReply,
                    updated_at: new Date().toISOString()
                })
                .eq('id', conversation_id);
        }

        res.json({
            success: true,
            reply: aiReply,
            conversation_id: savedConversationId
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        
        // Fallback response if AI fails
        const fallbackResponses = [
            `Xin chào! Tôi là chatbot tư vấn của HangHoaMmo. Hiện tại tôi đang gặp sự cố kỹ thuật nhưng vẫn có thể giúp bạn! 

🔥 **SẢN PHẨM HOT NHẤT:**
🎬 Netflix Premium - 45.000đ/tháng
🎵 Spotify Premium - 35.000đ/tháng  
🤖 ChatGPT Plus - 120.000đ/tháng
🎨 Canva Pro - 80.000đ/tháng

Bạn quan tâm sản phẩm nào? Liên hệ admin qua Telegram để được tư vấn chi tiết! 😊`,

            `Chào bạn! Tôi có thể giúp bạn tìm hiểu về sản phẩm:

💰 **BẢNG GIÁ PHỔ BIẾN:**
- Tài khoản Netflix: 45.000đ - 85.000đ
- Spotify Premium: 35.000đ - 60.000đ
- ChatGPT Plus: 120.000đ - 200.000đ
- Canva Pro: 80.000đ - 150.000đ
- VPN Premium: 50.000đ - 100.000đ

Bạn đang tìm loại sản phẩm nào? 🎮`,

            `Xin lỗi, tôi đang gặp chút vấn đề kỹ thuật. Nhưng đây là thông tin sản phẩm mới nhất:

🎯 **TOP DỊCH VỤ BÁN CHẠY:**
1. Netflix 4K Premium - 65.000đ (Bảo hành 1 tháng)
2. Spotify Family - 55.000đ (6 tài khoản)
3. ChatGPT Plus - 150.000đ (Không giới hạn)
4. Canva Pro - 90.000đ (Thiết kế chuyên nghiệp)

Liên hệ admin để đặt hàng ngay! 💬`
        ];
        
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        res.json({
            success: true,
            reply: randomResponse,
            conversation_id: null,
            fallback: true
        });
    }
});

// Get conversation history
router.get('/conversation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(404).json({
            success: false,
            message: 'Không tìm thấy cuộc hội thoại'
        });
    }
});

// Get products by category for better recommendations
router.get('/products/:category?', async (req, res) => {
    try {
        const { category } = req.params;
        
        let query = supabase
            .from('products')
            .select('name, price, description, category, image')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
            
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }
        
        const { data: products, error } = await query.limit(20);
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: products || [],
            category: category || 'all'
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.json({
            success: true,
            data: [
                { name: 'Netflix Premium 4K', price: 65000, description: 'Xem phim 4K không giới hạn', category: 'entertainment', stock: 50 },
                { name: 'Spotify Premium', price: 45000, description: 'Nghe nhạc không quảng cáo', category: 'entertainment', stock: 30 },
                { name: 'ChatGPT Plus', price: 150000, description: 'AI thông minh không giới hạn', category: 'ai', stock: 20 }
            ],
            fallback: true
        });
    }
});

module.exports = router;