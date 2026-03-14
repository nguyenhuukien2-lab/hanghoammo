const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../config/supabase');

// ─── Groq API (miễn phí, không cần thẻ) ─────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Lấy sản phẩm từ DB ──────────────────────────────────────────────────────
async function getProductsContext() {
    try {
        const { data: products } = await supabase
            .from('products')
            .select('name, price, description, category, stock_count')
            .eq('status', 'active')
            .order('sold', { ascending: false })
            .limit(50);
        return products || [];
    } catch {
        return [];
    }
}

// ─── Gọi Groq API (llama3 miễn phí) ─────────────────────────────────────────
async function callGroq(systemPrompt, history, userMessage) {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        { role: 'user', content: userMessage }
    ];
    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: 'llama-3.1-8b-instant', messages, max_tokens: 800, temperature: 0.7 },
        { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return response.data.choices[0].message.content;
}

// ─── Gọi Gemini API ───────────────────────────────────────────────────────────
async function callGemini(systemPrompt, history, userMessage) {
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const contents = [];
    for (const msg of history) {
        contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });
    const response = await axios.post(
        `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
        { system_instruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 800 } },
        { timeout: 15000 }
    );
    return response.data.candidates[0].content.parts[0].text;
}

// ─── Fallback thông minh (không cần API) ─────────────────────────────────────
function smartFallback(message, products) {
    const msg = message.toLowerCase();

    const formatPrice = (p) => p.toLocaleString('vi-VN') + 'đ';

    // Tìm sản phẩm liên quan
    const findProducts = (keywords) =>
        products.filter(p =>
            keywords.some(kw => p.name.toLowerCase().includes(kw) || (p.description || '').toLowerCase().includes(kw))
        ).slice(0, 3);

    const renderProducts = (list) => list.map(p =>
        `• <b>${p.name}</b> — ${formatPrice(p.price)}\n  ${p.description || ''}`
    ).join('\n\n');

    // Hỏi về giá / bảng giá
    if (msg.includes('giá') || msg.includes('bao nhiêu') || msg.includes('bảng giá') || msg.includes('price')) {
        const list = products.slice(0, 8);
        return `💰 <b>BẢNG GIÁ SẢN PHẨM</b>\n\n` +
            list.map(p => `• ${p.name}: <b>${formatPrice(p.price)}</b>`).join('\n') +
            `\n\n🛒 Xem đầy đủ tại: https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi về Netflix
    if (msg.includes('netflix')) {
        const list = findProducts(['netflix']);
        return list.length
            ? `🎬 <b>Tài khoản Netflix tại HangHoaMMO:</b>\n\n${renderProducts(list)}\n\n✅ Giao tự động, bảo hành 1 tháng\n📱 Liên hệ: @hanghoammo`
            : `🎬 Netflix Premium hiện có giá từ <b>45.000đ/tháng</b>\n✅ Giao tự động, bảo hành đổi mới nếu lỗi\n🛒 https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi về Spotify
    if (msg.includes('spotify')) {
        const list = findProducts(['spotify']);
        return list.length
            ? `🎵 <b>Tài khoản Spotify tại HangHoaMMO:</b>\n\n${renderProducts(list)}\n\n✅ Giao tự động, bảo hành 1 tháng`
            : `🎵 Spotify Premium từ <b>35.000đ/tháng</b>\n✅ Nghe nhạc không quảng cáo, tải offline\n🛒 https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi về ChatGPT / AI
    if (msg.includes('chatgpt') || msg.includes('gpt') || msg.includes('openai')) {
        const list = findProducts(['chatgpt', 'gpt', 'openai']);
        return list.length
            ? `🤖 <b>ChatGPT Plus tại HangHoaMMO:</b>\n\n${renderProducts(list)}\n\n✅ Tài khoản chính chủ, dùng ngay`
            : `🤖 ChatGPT Plus từ <b>120.000đ/tháng</b>\n✅ Không giới hạn tin nhắn, GPT-4\n🛒 https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi về Canva
    if (msg.includes('canva')) {
        const list = findProducts(['canva']);
        return list.length
            ? `🎨 <b>Canva Pro tại HangHoaMMO:</b>\n\n${renderProducts(list)}`
            : `🎨 Canva Pro từ <b>80.000đ/tháng</b>\n✅ Templates premium, xuất file không watermark\n🛒 https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi về VPN
    if (msg.includes('vpn') || msg.includes('nordvpn') || msg.includes('expressvpn')) {
        const list = findProducts(['vpn']);
        return list.length
            ? `🛡️ <b>VPN tại HangHoaMMO:</b>\n\n${renderProducts(list)}`
            : `🛡️ VPN Premium từ <b>50.000đ/tháng</b>\n✅ Tốc độ cao, bảo mật tuyệt đối\n🛒 https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi về YouTube
    if (msg.includes('youtube')) {
        const list = findProducts(['youtube']);
        return list.length
            ? `▶️ <b>YouTube Premium tại HangHoaMMO:</b>\n\n${renderProducts(list)}`
            : `▶️ YouTube Premium từ <b>55.000đ/tháng</b>\n✅ Xem không quảng cáo, tải video offline\n🛒 https://hanghoammo.onrender.com/products.html`;
    }

    // Hỏi cách mua / thanh toán
    if (msg.includes('mua') || msg.includes('thanh toán') || msg.includes('cách') || msg.includes('hướng dẫn')) {
        return `🛒 <b>HƯỚNG DẪN MUA HÀNG</b>\n\n` +
            `1️⃣ Đăng ký tài khoản tại website\n` +
            `2️⃣ Nạp tiền vào ví (chuyển khoản)\n` +
            `3️⃣ Chọn sản phẩm → Thêm vào giỏ\n` +
            `4️⃣ Thanh toán → Nhận tài khoản <b>ngay lập tức</b>\n\n` +
            `💳 Hỗ trợ: Chuyển khoản ngân hàng, ví điện tử\n` +
            `📱 Hỗ trợ 24/7: @hanghoammo | 0879.06.2222`;
    }

    // Hỏi về bảo hành
    if (msg.includes('bảo hành') || msg.includes('lỗi') || msg.includes('đổi') || msg.includes('hoàn tiền')) {
        return `🛡️ <b>CHÍNH SÁCH BẢO HÀNH</b>\n\n` +
            `✅ Bảo hành <b>1 tháng</b> cho tất cả sản phẩm\n` +
            `✅ Đổi mới ngay nếu tài khoản lỗi\n` +
            `✅ Hoàn tiền nếu không có hàng\n` +
            `✅ Hỗ trợ xử lý trong <b>5-15 phút</b>\n\n` +
            `📱 Liên hệ: @hanghoammo | 0879.06.2222`;
    }

    // Hỏi về sản phẩm AI / hot
    if (msg.includes('ai') || msg.includes('hot') || msg.includes('mới') || msg.includes('nổi bật')) {
        const aiProducts = findProducts(['ai', 'chatgpt', 'midjourney', 'gemini', 'claude']);
        if (aiProducts.length) {
            return `🔥 <b>SẢN PHẨM AI HOT NHẤT:</b>\n\n${renderProducts(aiProducts)}\n\n🛒 https://hanghoammo.onrender.com/products.html`;
        }
    }

    // Hỏi chung về sản phẩm
    if (msg.includes('sản phẩm') || msg.includes('có gì') || msg.includes('danh sách') || msg.includes('tất cả')) {
        const cats = [...new Set(products.map(p => p.category))];
        return `📦 <b>DANH MỤC SẢN PHẨM:</b>\n\n` +
            cats.map(c => {
                const items = products.filter(p => p.category === c).slice(0, 2);
                return `📂 <b>${c}</b>: ${items.map(p => p.name).join(', ')}`;
            }).join('\n') +
            `\n\n🛒 Xem tất cả: https://hanghoammo.onrender.com/products.html`;
    }

    // Chào hỏi
    if (msg.includes('xin chào') || msg.includes('hello') || msg.includes('hi') || msg.includes('chào')) {
        return `👋 <b>Xin chào! Tôi là AI tư vấn của HangHoaMMO</b>\n\n` +
            `Tôi có thể giúp bạn:\n` +
            `🎯 Tìm sản phẩm phù hợp\n` +
            `💰 Tư vấn giá cả chi tiết\n` +
            `🛒 Hướng dẫn mua hàng\n` +
            `🛡️ Giải đáp chính sách bảo hành\n\n` +
            `Bạn đang tìm kiếm sản phẩm gì? 😊`;
    }

    // Tìm kiếm tên sản phẩm bất kỳ trong DB
    const found = products.filter(p =>
        p.name.toLowerCase().split(' ').some(w => w.length > 3 && msg.includes(w))
    ).slice(0, 3);

    if (found.length) {
        return `🔍 <b>Tìm thấy sản phẩm phù hợp:</b>\n\n${renderProducts(found)}\n\n` +
            `📱 Liên hệ: @hanghoammo để được tư vấn thêm!`;
    }

    // Default
    return `🤖 Tôi hiểu bạn đang hỏi về "<b>${message}</b>"\n\n` +
        `Để được tư vấn chính xác nhất, bạn có thể:\n` +
        `• Hỏi cụ thể tên sản phẩm (Netflix, Spotify, ChatGPT...)\n` +
        `• Hỏi về giá cả, bảo hành, cách mua\n` +
        `• Liên hệ trực tiếp: @hanghoammo | 0879.06.2222\n\n` +
        `🛒 Xem tất cả sản phẩm: https://hanghoammo.onrender.com/products.html`;
}

// ─── Route chính ──────────────────────────────────────────────────────────────
router.post('/message', async (req, res) => {
    try {
        const { message, conversation_id } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tin nhắn' });
        }

        const products = await getProductsContext();

        // System prompt
        const systemPrompt = `Bạn là AI tư vấn bán hàng của HangHoaMMO - website bán tài khoản số, phần mềm, dịch vụ MMO uy tín tại Việt Nam.

THÔNG TIN SẢN PHẨM HIỆN CÓ (${products.length} sản phẩm):
${products.map(p => `- ${p.name}: ${p.price?.toLocaleString('vi-VN')}đ | ${p.description || ''} | Danh mục: ${p.category}`).join('\n')}

THÔNG TIN SHOP:
- Website: https://hanghoammo.onrender.com
- Telegram: @hanghoammo
- Hotline: 0879.06.2222
- Giao hàng: Tự động 24/7 sau thanh toán
- Bảo hành: 1 tháng, đổi mới nếu lỗi
- Thanh toán: Chuyển khoản ngân hàng, ví điện tử

NHIỆM VỤ:
- Tư vấn sản phẩm phù hợp với nhu cầu khách
- Trả lời MỌI câu hỏi về sản phẩm, giá, tính năng, bảo hành
- Hướng dẫn mua hàng chi tiết
- So sánh sản phẩm khi được hỏi
- Luôn thân thiện, nhiệt tình, dùng emoji

QUY TẮC:
- Luôn hiển thị giá cụ thể khi tư vấn
- Gợi ý 2-3 sản phẩm phù hợp nhất
- Trả lời bằng tiếng Việt
- Format đẹp, dễ đọc với emoji
- Nếu không có sản phẩm trong DB, vẫn tư vấn dựa trên kiến thức chung về sản phẩm số`;

        // Lấy lịch sử hội thoại
        let history = [];
        if (conversation_id) {
            try {
                const { data } = await supabase
                    .from('ai_conversations')
                    .select('messages')
                    .eq('id', conversation_id)
                    .single();
                if (data?.messages) history = data.messages.slice(-10); // giữ 10 tin gần nhất
            } catch {}
        }

        let aiReply;
        let isFallback = false;

        // Thử Groq trước (miễn phí, nhanh), sau đó Gemini, cuối cùng fallback
        if (GROQ_API_KEY) {
            try {
                aiReply = await callGroq(systemPrompt, history, message);
            } catch (e) {
                console.error('Groq error:', e.message);
                if (GEMINI_API_KEY) {
                    try { aiReply = await callGemini(systemPrompt, history, message); }
                    catch (e2) { console.error('Gemini error:', e2.message); }
                }
            }
        } else if (GEMINI_API_KEY) {
            try { aiReply = await callGemini(systemPrompt, history, message); }
            catch (e) { console.error('Gemini error:', e.message); }
        }

        if (!aiReply) {
            aiReply = smartFallback(message, products);
            isFallback = true;
        }

        // Lưu lịch sử
        const newHistory = [
            ...history,
            { role: 'user', content: message },
            { role: 'assistant', content: aiReply }
        ];

        let savedId = conversation_id;
        if (!conversation_id) {
            const { data } = await supabase
                .from('ai_conversations')
                .insert({ messages: newHistory, last_message: aiReply, created_at: new Date().toISOString() })
                .select('id').single();
            if (data) savedId = data.id;
        } else {
            await supabase
                .from('ai_conversations')
                .update({ messages: newHistory, last_message: aiReply, updated_at: new Date().toISOString() })
                .eq('id', conversation_id);
        }

        res.json({ success: true, reply: aiReply, conversation_id: savedId, fallback: isFallback });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.json({
            success: true,
            reply: '😅 Xin lỗi, tôi đang gặp sự cố nhỏ. Vui lòng liên hệ @hanghoammo hoặc gọi 0879.06.2222 để được hỗ trợ ngay!',
            fallback: true
        });
    }
});

// Kiểm tra trạng thái AI
router.get('/status', (req, res) => {
    res.json({
        success: true,
        groq: !!process.env.GROQ_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        mode: process.env.GROQ_API_KEY ? 'groq' : process.env.GEMINI_API_KEY ? 'gemini' : 'fallback'
    });
});

// Lấy lịch sử hội thoại
router.get('/conversation/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ai_conversations').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch {
        res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
    }
});

module.exports = router;
