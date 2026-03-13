const { supabase } = require('../src/config/supabase');

// Hàm cập nhật ảnh cho sản phẩm cụ thể
async function updateProductImage(productName, newImageUrl) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ image: newImageUrl })
            .ilike('name', `%${productName}%`)
            .select();
            
        if (error) {
            console.log(`❌ Lỗi cập nhật:`, error.message);
            return false;
        }
        
        if (data.length === 0) {
            console.log(`❌ Không tìm thấy sản phẩm: ${productName}`);
            return false;
        }
        
        console.log(`✅ Đã cập nhật ảnh cho: ${data[0].name}`);
        console.log(`🖼️  Ảnh mới: ${newImageUrl}`);
        return true;
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
        return false;
    }
}

// Hàm cập nhật nhiều ảnh cùng lúc
async function updateMultipleImages() {
    console.log('🖼️  Cập nhật ảnh sản phẩm...\n');
    
    // Danh sách ảnh mới (thay đổi theo ý muốn)
    const imageUpdates = [
        {
            productName: 'ChatGPT',
            newImage: 'https://cdn.openai.com/chatgpt/images/chatgpt-share-og.png'
        },
        {
            productName: 'Netflix',
            newImage: 'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.png'
        },
        {
            productName: 'Spotify',
            newImage: 'https://developer.spotify.com/assets/branding-guidelines/icon1@2x.png'
        },
        {
            productName: 'YouTube',
            newImage: 'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32x32.png'
        },
        {
            productName: 'Canva',
            newImage: 'https://static.canva.com/web/images/12487a1e645230d7ae4f3c92b068fbc2.png'
        }
    ];
    
    for (const update of imageUpdates) {
        await updateProductImage(update.productName, update.newImage);
        console.log(''); // Dòng trống
    }
    
    console.log('🎉 Hoàn thành cập nhật ảnh!');
}

// Chạy script
if (require.main === module) {
    const productName = process.argv[2];
    const imageUrl = process.argv[3];
    
    if (productName && imageUrl) {
        // Cập nhật 1 sản phẩm cụ thể
        updateProductImage(productName, imageUrl);
    } else if (productName === 'all') {
        // Cập nhật nhiều sản phẩm
        updateMultipleImages();
    } else {
        console.log(`
🖼️  Cập nhật ảnh sản phẩm

Cách sử dụng:
  node scripts/update-specific-image.js "ChatGPT" "https://new-image-url.com/image.png"
  node scripts/update-specific-image.js all

Ví dụ:
  node scripts/update-specific-image.js "Netflix" "https://example.com/netflix-logo.png"
        `);
    }
}

module.exports = { updateProductImage };