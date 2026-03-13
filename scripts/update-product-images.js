const { supabase } = require('../src/config/supabase');

// Danh sách ảnh tốt hơn cho các sản phẩm
const imageUpdates = {
    'ChatGPT Pro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png',
    'CapCut Pro': 'https://seeklogo.com/images/C/capcut-logo-D5FD35E8C0-seeklogo.com.png',
    'Canva Education': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Canva_icon_2021.svg/512px-Canva_icon_2021.svg.png',
    'Netflix Premium': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png',
    'Spotify Premium': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png',
    'YouTube Premium': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png',
    'Microsoft Office': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/512px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png',
    'Disney+': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Disney%2B_logo.svg/512px-Disney%2B_logo.svg.png',
    'Grammarly': 'https://seeklogo.com/images/G/grammarly-logo-6D9EE5A774-seeklogo.com.png',
    'Figma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/512px-Figma-logo.svg.png',
    'Zoom Pro': 'https://seeklogo.com/images/Z/zoom-logo-8A0E1389B5-seeklogo.com.png'
};

async function updateProductImages() {
    try {
        console.log('🖼️  Cập nhật ảnh sản phẩm...');
        
        // Lấy tất cả sản phẩm
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, image')
            .eq('status', 'active');
            
        if (error) {
            console.log('❌ Lỗi lấy sản phẩm:', error.message);
            return;
        }
        
        console.log(`📦 Tìm thấy ${products.length} sản phẩm`);
        
        for (const product of products) {
            // Tìm ảnh phù hợp dựa trên tên sản phẩm
            let newImage = null;
            
            for (const [keyword, imageUrl] of Object.entries(imageUpdates)) {
                if (product.name.toLowerCase().includes(keyword.toLowerCase())) {
                    newImage = imageUrl;
                    break;
                }
            }
            
            if (newImage && newImage !== product.image) {
                // Cập nhật ảnh
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image: newImage })
                    .eq('id', product.id);
                    
                if (updateError) {
                    console.log(`❌ Lỗi cập nhật ${product.name}:`, updateError.message);
                } else {
                    console.log(`✅ Cập nhật ảnh: ${product.name}`);
                }
            } else if (!product.image || product.image === '') {
                // Thêm ảnh mặc định cho sản phẩm chưa có ảnh
                const defaultImage = 'https://via.placeholder.com/300x200/667eea/ffffff?text=' + encodeURIComponent(product.name.substring(0, 10));
                
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image: defaultImage })
                    .eq('id', product.id);
                    
                if (!updateError) {
                    console.log(`✅ Thêm ảnh mặc định: ${product.name}`);
                }
            } else {
                console.log(`ℹ️  Giữ nguyên ảnh: ${product.name}`);
            }
        }
        
        console.log('\n🎉 Hoàn thành cập nhật ảnh sản phẩm!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

updateProductImages();