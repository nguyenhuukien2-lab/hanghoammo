const { supabase } = require('../src/config/supabase');

const newProducts = [
    {
        name: 'YouTube Premium 1 năm',
        category: 'entertainment',
        price: 89000,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png',
        description: 'YouTube Premium không quảng cáo, tải video offline',
        badge: 'NEW',
        sold: 45,
        status: 'active'
    },
    {
        name: 'Microsoft Office 365',
        category: 'design',
        price: 150000,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/1024px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png',
        description: 'Bộ Office 365 đầy đủ tính năng',
        badge: 'HOT',
        sold: 78,
        status: 'active'
    },
    {
        name: 'Disney+ Premium',
        category: 'entertainment',
        price: 65000,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Disney%2B_logo.svg/1024px-Disney%2B_logo.svg.png',
        description: 'Xem phim Disney, Marvel, Star Wars không giới hạn',
        badge: 'SALE',
        sold: 23,
        status: 'active'
    },
    {
        name: 'Grammarly Premium',
        category: 'other',
        price: 95000,
        image: 'https://static.grammarly.com/assets/files/efe57d016d9efff36da7884c193b646b/grammarly_logo_white.svg',
        description: 'Kiểm tra ngữ pháp tiếng Anh chuyên nghiệp',
        badge: 'NEW',
        sold: 34,
        status: 'active'
    },
    {
        name: 'Figma Professional',
        category: 'design',
        price: 120000,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/1024px-Figma-logo.svg.png',
        description: 'Thiết kế UI/UX chuyên nghiệp với Figma Pro',
        badge: 'HOT',
        sold: 67,
        status: 'active'
    },
    {
        name: 'Zoom Pro 1 năm',
        category: 'other',
        price: 180000,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Zoom_Communications_Logo.svg/1024px-Zoom_Communications_Logo.svg.png',
        description: 'Zoom Pro cho họp online không giới hạn thời gian',
        badge: 'NEW',
        sold: 12,
        status: 'active'
    }
    
];

async function addSampleProducts() {
    try {
        console.log('🚀 Thêm sản phẩm mới...');
        
        for (const product of newProducts) {
            const { data, error } = await supabase
                .from('products')
                .insert([product])
                .select()
                .single();
            
            if (error) {
                console.log(`❌ Lỗi thêm ${product.name}:`, error.message);
            } else {
                console.log(`✅ Đã thêm: ${product.name} - ${product.price.toLocaleString('vi-VN')}đ`);
            }
        }
        
        // Kiểm tra tổng số sản phẩm
        const { data: allProducts, error: countError } = await supabase
            .from('products')
            .select('id, name')
            .eq('status', 'active');
            
        if (!countError) {
            console.log(`\n📊 Tổng cộng: ${allProducts.length} sản phẩm trong database`);
        }
        
        console.log('\n🎉 Hoàn thành thêm sản phẩm mới!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

addSampleProducts();