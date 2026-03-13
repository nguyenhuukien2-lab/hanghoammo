const { supabase } = require('../src/config/supabase');

// Danh sách ảnh chất lượng cao từ các nguồn chính thức
const betterImages = {
    'ChatGPT': 'https://cdn.openai.com/chatgpt/images/chatgpt-share-og.png',
    'Netflix': 'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.png',
    'Spotify': 'https://developer.spotify.com/assets/branding-guidelines/icon1@2x.png',
    'YouTube': 'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32x32.png',
    'Disney': 'https://cnbl-cdn.bamgrid.com/assets/7ecc8bcb60ad77193058d63e321bd21cbac2fc67281dbd9927676ea4a4c83594/original',
    'Microsoft': 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31',
    'Office': 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31',
    'Canva': 'https://static.canva.com/web/images/12487a1e645230d7ae4f3c92b068fbc2.png',
    'Adobe': 'https://www.adobe.com/content/dam/cc/icons/Adobe_Corporate_Horizontal_Red_HEX.svg',
    'Photoshop': 'https://www.adobe.com/content/dam/cc/icons/photoshop.svg',
    'Figma': 'https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png?w=804&h=804&q=75&fit=max&auto=format',
    'Zoom': 'https://d24cgw3uvb9a9h.cloudfront.net/static/93516/image/new/ZoomLogo_112x112.png',
    'Grammarly': 'https://static.grammarly.com/assets/files/efe57d016d9efff36da7884c193b646b/grammarly_logo_white.svg',
    'Notion': 'https://www.notion.so/images/logo-ios.png',
    'Discord': 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    'CapCut': 'https://lf16-capcut-va.ibytedtos.com/obj/capcutpc-va/fb9c8c9b-04b5-4c80-8c5e-7f4b1b0b1b0b.png'
};

async function updateToBetterImages() {
    try {
        console.log('🖼️  Cập nhật ảnh chất lượng cao...\n');
        
        // Lấy tất cả sản phẩm
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, image')
            .eq('status', 'active');
            
        if (error) {
            console.log('❌ Lỗi lấy sản phẩm:', error.message);
            return;
        }
        
        let updateCount = 0;
        
        for (const product of products) {
            // Tìm ảnh tốt hơn
            let betterImage = null;
            
            for (const [keyword, imageUrl] of Object.entries(betterImages)) {
                if (product.name.toLowerCase().includes(keyword.toLowerCase())) {
                    betterImage = imageUrl;
                    break;
                }
            }
            
            if (betterImage && betterImage !== product.image) {
                // Cập nhật ảnh
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image: betterImage })
                    .eq('id', product.id);
                    
                if (!updateError) {
                    console.log(`✅ ${product.name}`);
                    console.log(`   Cũ: ${product.image.substring(0, 50)}...`);
                    console.log(`   Mới: ${betterImage.substring(0, 50)}...`);
                    console.log('');
                    updateCount++;
                }
            }
        }
        
        console.log(`🎉 Đã cập nhật ${updateCount} ảnh sản phẩm!`);
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

updateToBetterImages();