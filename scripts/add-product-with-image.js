const { supabase } = require('../src/config/supabase');

// Hàm tự động tìm ảnh phù hợp dựa trên tên sản phẩm
function getImageForProduct(productName) {
    const name = productName.toLowerCase();
    
    // Danh sách ảnh cho các brand phổ biến
    const brandImages = {
        'chatgpt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png',
        'netflix': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png',
        'spotify': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png',
        'youtube': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png',
        'canva': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Canva_icon_2021.svg/512px-Canva_icon_2021.svg.png',
        'adobe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Adobe_Creative_Cloud_rainbow_icon.svg/512px-Adobe_Creative_Cloud_rainbow_icon.svg.png',
        'microsoft': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/512px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png',
        'office': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/512px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png',
        'disney': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Disney%2B_logo.svg/512px-Disney%2B_logo.svg.png',
        'figma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/512px-Figma-logo.svg.png',
        'zoom': 'https://seeklogo.com/images/Z/zoom-logo-8A0E1389B5-seeklogo.com.png',
        'grammarly': 'https://seeklogo.com/images/G/grammarly-logo-6D9EE5A774-seeklogo.com.png',
        'capcut': 'https://seeklogo.com/images/C/capcut-logo-D5FD35E8C0-seeklogo.com.png',
        'gmail': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/512px-Gmail_icon_%282020%29.svg.png',
        'dropbox': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/512px-Dropbox_Icon.svg.png',
        'notion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Notion_app_logo.png/512px-Notion_app_logo.png',
        'slack': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/512px-Slack_icon_2019.svg.png',
        'trello': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Trello_logo.svg/512px-Trello_logo.svg.png',
        'discord': 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png'
    };
    
    // Tìm ảnh phù hợp
    for (const [keyword, imageUrl] of Object.entries(brandImages)) {
        if (name.includes(keyword)) {
            return imageUrl;
        }
    }
    
    // Ảnh mặc định theo danh mục
    if (name.includes('premium') || name.includes('pro')) {
        return 'https://via.placeholder.com/300x200/667eea/ffffff?text=Premium';
    }
    
    // Ảnh mặc định
    return 'https://via.placeholder.com/300x200/667eea/ffffff?text=' + encodeURIComponent(productName.substring(0, 10));
}

// Hàm thêm sản phẩm mới với ảnh tự động
async function addProductWithImage(productData) {
    try {
        // Tự động thêm ảnh nếu chưa có
        if (!productData.image) {
            productData.image = getImageForProduct(productData.name);
        }
        
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();
        
        if (error) {
            console.log(`❌ Lỗi thêm sản phẩm:`, error.message);
            return null;
        }
        
        console.log(`✅ Đã thêm: ${productData.name} - ${productData.price.toLocaleString('vi-VN')}đ`);
        console.log(`🖼️  Ảnh: ${productData.image}`);
        return data;
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
        return null;
    }
}

// Ví dụ sử dụng - thêm một số sản phẩm mới
async function addMoreProducts() {
    console.log('🚀 Thêm sản phẩm mới với ảnh tự động...\n');
    
    const newProducts = [
        {
            name: 'Notion Pro 1 năm',
            category: 'other',
            price: 75000,
            description: 'Workspace thông minh cho team và cá nhân',
            badge: 'NEW',
            sold: 15,
            status: 'active'
        },
        {
            name: 'Discord Nitro',
            category: 'other',
            price: 45000,
            description: 'Discord Nitro với tính năng premium',
            badge: 'HOT',
            sold: 89,
            status: 'active'
        },
        {
            name: 'Adobe Photoshop',
            category: 'design',
            price: 200000,
            description: 'Phần mềm chỉnh sửa ảnh chuyên nghiệp',
            badge: 'HOT',
            sold: 156,
            status: 'active'
        }
    ];
    
    for (const product of newProducts) {
        await addProductWithImage(product);
    }
    
    console.log('\n🎉 Hoàn thành thêm sản phẩm mới!');
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
    addMoreProducts();
}

// Export để sử dụng ở nơi khác
module.exports = { addProductWithImage, getImageForProduct };