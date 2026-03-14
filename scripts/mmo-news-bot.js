/**
 * MMO News Bot - Tự động cào tin tức MMO/công nghệ và gửi vào nhóm Telegram
 * Lịch gửi: 8:00 sáng, 12:00 trưa, 20:00 tối mỗi ngày
 * Chạy: node scripts/mmo-news-bot.js
 */
require('dotenv').config();
const https = require('https');
const http = require('http');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

// ─── Cấu hình ────────────────────────────────────────────────────────────────
const CONFIG = {
    // Số bài gửi mỗi đợt (mỗi buổi)
    maxPostsPerSession: 8,
    // Lịch gửi trong ngày (giờ VN): sáng 8h, trưa 12h, tối 20h
    scheduleHours: [8, 12, 20],
    // Cache bài đã gửi (tránh trùng)
    sentIds: new Set(),
    // Lần check cuối
    lastCheckedHour: -1,
};

// ─── Nguồn RSS (đã kiểm tra hoạt động) ──────────────────────────────────────
// mode: 'filter' = lọc từ khóa | 'all' = lấy tất cả bài
const RSS_SOURCES = [
    {
        name: '💰 VNExpress Kinh Doanh',
        url: 'https://vnexpress.net/rss/kinh-doanh.rss',
        mode: 'filter',
        keywords: [
            'kiếm tiền', 'thu nhập', 'kinh doanh online', 'thương mại điện tử',
            'affiliate', 'dropship', 'freelance', 'tiktok', 'shopee', 'lazada',
            'youtube', 'content', 'influencer', 'startup', 'khởi nghiệp',
            'crypto', 'bitcoin', 'trading', 'đầu tư', 'chứng khoán',
            'ai', 'chatgpt', 'automation', 'saas', 'app',
        ],
    },
    {
        name: '📱 Tinh Tế Tech',
        url: 'https://tinhte.vn/rss',
        mode: 'all', // lấy tất cả tin công nghệ từ Tinh Tế
        keywords: [],
    },
];

// ─── Từ khóa MMO tổng hợp ────────────────────────────────────────────────────
const MMO_KEYWORDS = [
    // Kiếm tiền online
    'kiếm tiền', 'thu nhập', 'passive income', 'thu nhập thụ động',
    'kinh doanh online', 'làm giàu', 'tự do tài chính',
    // Nền tảng
    'tiktok', 'youtube', 'shopee', 'lazada', 'tiki', 'sendo',
    'facebook ads', 'google ads', 'instagram',
    // Mô hình kinh doanh
    'affiliate', 'dropship', 'dropshipping', 'print on demand',
    'freelance', 'remote work', 'làm việc từ xa', 'content creator',
    'influencer', 'kol', 'ugc', 'review', 'unboxing',
    // AI & Tools
    'ai', 'chatgpt', 'openai', 'gemini', 'claude', 'midjourney',
    'automation', 'tool', 'saas', 'no-code', 'low-code',
    // Tài chính số
    'crypto', 'bitcoin', 'ethereum', 'nft', 'defi', 'trading',
    'forex', 'chứng khoán', 'đầu tư', 'p2p',
    // Kỹ năng số
    'seo', 'digital marketing', 'email marketing', 'copywriting',
    'web design', 'app', 'startup', 'khởi nghiệp',
    // Tài khoản số (liên quan shop)
    'netflix', 'spotify', 'vpn', 'tài khoản số', 'phần mềm',
];

// ─── Fetch URL ────────────────────────────────────────────────────────────────
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const options = {
            timeout: 12000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MMONewsBot/1.0)' },
        };
        const req = client.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// ─── Parse RSS ────────────────────────────────────────────────────────────────
function parseRSS(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link') || extractAttr(block, 'link', 'href');
        const description = extractTag(block, 'description');
        const pubDate = extractTag(block, 'pubDate');
        const guid = extractTag(block, 'guid') || link;
        if (title && link) items.push({ title, link, description, pubDate, guid });
    }
    return items;
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
    const m = xml.match(regex);
    if (!m) return '';
    return m[1].trim()
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'").replace(/<[^>]+>/g, '');
}

function extractAttr(xml, tag, attr) {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, 'i');
    const m = xml.match(regex);
    return m ? m[1] : '';
}

// ─── Lọc bài liên quan MMO ───────────────────────────────────────────────────
function isMMORelated(item, source) {
    if (source.mode === 'all') return true;
    const text = `${item.title} ${item.description}`.toLowerCase();
    const keywords = [...MMO_KEYWORDS, ...(source.keywords || [])];
    return keywords.some(kw => text.includes(kw.toLowerCase()));
}

// ─── Lọc bài trong 24h qua ───────────────────────────────────────────────────
function isRecent(pubDate) {
    if (!pubDate) return true; // không có ngày thì cứ lấy
    const pub = new Date(pubDate);
    const now = new Date();
    const diffHours = (now - pub) / (1000 * 60 * 60);
    return diffHours <= 24;
}

// ─── Gửi Telegram ────────────────────────────────────────────────────────────
function sendTelegram(chatId, text) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
        });
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(JSON.parse(data));
                else reject(new Error(`Telegram ${res.statusCode}: ${data}`));
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// ─── Format tin nhắn ─────────────────────────────────────────────────────────
function formatNewsMessage(item, sourceName, index, total) {
    let desc = item.description
        ? item.description.replace(/<[^>]+>/g, '').trim().slice(0, 250)
        : '';
    if (item.description && item.description.length > 250) desc += '...';

    const date = item.pubDate
        ? new Date(item.pubDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : '';

    return `📰 <b>[${index}/${total}] TIN MMO MỚI NHẤT</b>

🔖 <b>${item.title}</b>
${desc ? `\n📝 ${desc}\n` : ''}
🌐 <i>${sourceName}</i>${date ? ` • ⏰ ${date}` : ''}

🔗 <a href="${item.link}">Đọc bài đầy đủ →</a>

━━━━━━━━━━━━━━━━━━━━
🛒 <a href="https://hanghoammo.onrender.com">HangHoaMMO.com</a> | 📱 @hanghoammo`;
}

// ─── Format tin nhắn tóm tắt đầu buổi ───────────────────────────────────────
function formatSessionHeader(sessionName, totalNews) {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    return `🗞️ <b>BẢN TIN MMO ${sessionName.toUpperCase()}</b>
📅 ${now}

Tổng hợp <b>${totalNews} tin tức</b> MMO/công nghệ mới nhất hôm nay 👇`;
}

// ─── Cào tin từ một nguồn ────────────────────────────────────────────────────
async function fetchFromSource(source) {
    try {
        console.log(`  🔍 Cào: ${source.name}`);
        const xml = await fetchUrl(source.url);
        const items = parseRSS(xml);

        const relevant = items.filter(item =>
            !CONFIG.sentIds.has(item.guid) &&
            isMMORelated(item, source) &&
            isRecent(item.pubDate)
        );

        console.log(`     → ${items.length} bài tổng, ${relevant.length} bài mới & liên quan`);
        return relevant.map(item => ({ ...item, sourceName: source.name }));
    } catch (err) {
        console.error(`  ❌ Lỗi ${source.name}:`, err.message);
        return [];
    }
}

// ─── Chạy một buổi gửi tin ───────────────────────────────────────────────────
async function runNewsSession(sessionName) {
    console.log(`\n📰 [${new Date().toLocaleString('vi-VN')}] Bắt đầu bản tin ${sessionName}...`);

    if (!BOT_TOKEN || !GROUP_CHAT_ID) {
        console.error('❌ Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_ADMIN_CHAT_ID');
        return;
    }

    // Cào tất cả nguồn song song
    const results = await Promise.all(RSS_SOURCES.map(fetchFromSource));
    let allNews = results.flat();

    // Sắp xếp theo ngày mới nhất
    allNews.sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate) : new Date(0);
        const db = b.pubDate ? new Date(b.pubDate) : new Date(0);
        return db - da;
    });

    // Giới hạn số bài gửi
    const toSend = allNews.slice(0, CONFIG.maxPostsPerSession);

    if (toSend.length === 0) {
        console.log('ℹ️  Không có tin mới trong 24h qua.');
        return;
    }

    // Gửi header tóm tắt
    try {
        await sendTelegram(GROUP_CHAT_ID, formatSessionHeader(sessionName, toSend.length));
        await sleep(1500);
    } catch (e) {
        console.error('Lỗi gửi header:', e.message);
    }

    // Gửi từng tin
    let sent = 0;
    for (let i = 0; i < toSend.length; i++) {
        const item = toSend[i];
        try {
            const msg = formatNewsMessage(item, item.sourceName, i + 1, toSend.length);
            await sendTelegram(GROUP_CHAT_ID, msg);
            CONFIG.sentIds.add(item.guid);
            sent++;
            console.log(`  ✅ Đã gửi [${i + 1}/${toSend.length}]: ${item.title.slice(0, 60)}...`);
            await sleep(2000); // delay tránh spam
        } catch (e) {
            console.error(`  ❌ Lỗi gửi tin [${i + 1}]:`, e.message);
        }
    }

    console.log(`✅ Bản tin ${sessionName}: đã gửi ${sent}/${toSend.length} tin.`);

    // Dọn cache
    if (CONFIG.sentIds.size > 1000) {
        const arr = [...CONFIG.sentIds];
        CONFIG.sentIds.clear();
        arr.slice(-500).forEach(id => CONFIG.sentIds.add(id));
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ─── Scheduler - kiểm tra giờ mỗi phút ──────────────────────────────────────
function getSessionName(hour) {
    if (hour === 8) return 'Buổi Sáng';
    if (hour === 12) return 'Buổi Trưa';
    if (hour === 20) return 'Buổi Tối';
    return `${hour}h`;
}

async function checkSchedule() {
    const now = new Date();
    // Giờ theo múi giờ VN (UTC+7)
    const vnHour = (now.getUTCHours() + 7) % 24;
    const vnMinute = now.getUTCMinutes();

    // Chỉ chạy đúng phút 0 của các giờ đã lên lịch, và chưa chạy trong giờ này
    if (
        vnMinute === 0 &&
        CONFIG.scheduleHours.includes(vnHour) &&
        CONFIG.lastCheckedHour !== vnHour
    ) {
        CONFIG.lastCheckedHour = vnHour;
        await runNewsSession(getSessionName(vnHour));
    }
}

// ─── Khởi động bot (dùng cho cả standalone và embedded) ─────────────────────
async function startBot() {
    console.log('🤖 MMO News Bot khởi động...');
    console.log(`📡 ${RSS_SOURCES.length} nguồn RSS`);
    console.log(`⏰ Lịch gửi: ${CONFIG.scheduleHours.map(h => h + ':00').join(', ')} (giờ VN)`);
    console.log(`📦 Mỗi buổi: tối đa ${CONFIG.maxPostsPerSession} tin\n`);

    try {
        await sendTelegram(GROUP_CHAT_ID,
            `🚀 <b>MMO News Bot đã khởi động!</b>\n\n` +
            `📡 Theo dõi <b>${RSS_SOURCES.length} nguồn</b> tin tức\n` +
            `⏰ Gửi bản tin lúc: <b>${CONFIG.scheduleHours.map(h => h + ':00').join(', ')}</b> mỗi ngày\n` +
            `📦 Mỗi buổi tối đa <b>${CONFIG.maxPostsPerSession} tin</b> mới nhất\n\n` +
            `<i>Nguồn: ${RSS_SOURCES.map(s => s.name).join(' | ')}</i>`
        );
    } catch (e) {
        console.error('Lỗi gửi tin khởi động:', e.message);
    }

    // Chạy ngay lần đầu
    await runNewsSession('Khởi Động');

    // Check lịch mỗi phút
    setInterval(checkSchedule, 60 * 1000);
}

// Chạy trực tiếp: node scripts/mmo-news-bot.js
if (require.main === module) {
    startBot().catch(console.error);
}

module.exports = { startBot, runNewsSession, CONFIG, RSS_SOURCES };
