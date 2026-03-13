const { supabase } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

async function importProductsFromJSON() {
    try {
        console.log('📁 Đọc file products.json...');
        
        // Đọc file JSON
        const jsonPath = path.join(__dirname, '../data/products.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log(`📦 Tìm thấy ${jsonData.products.length} sản phẩm trong file JSON`);
        
        // Xóa tất cả sản phẩm cũ (tùy chọn)
        const clearOld = process.argv.includes('--clear');
        if (clearOld) {
            console.log('🗑️  Xóa sản phẩm cũ...');
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Xóa tất cả
            
            if (deleteError) {
                console.log('❌ Lỗi xóa sản phẩm cũ:', deleteError.message);
            } else {
                console.log('✅ Đã xóa sản phẩm cũ');
            }
        }
        
        // Import sản phẩm mới
        console.log('📥 Import sản phẩm...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const product of jsonData.products) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .insert([product])
                    .select()
                    .single();
                
                if (error) {
                    console.log(`❌ Lỗi thêm ${product.name}:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Đã thêm: ${product.name}`);
                    successCount++;
                }
            } catch (err) {
                console.log(`❌ Lỗi thêm ${product.name}:`, err.message);
                errorCount++;
            }
        }
        
        console.log(`\n📊 Kết quả:`);
        console.log(`✅ Thành công: ${successCount} sản phẩm`);
        console.log(`❌ Lỗi: ${errorCount} sản phẩm`);
        
        // Kiểm tra tổng số sản phẩm
        const { data: allProducts, error: countError } = await supabase
            .from('products')
            .select('id')
            .eq('status', 'active');
            
        if (!countError) {
            console.log(`📦 Tổng cộng: ${allProducts.length} sản phẩm trong database`);
        }
        
        console.log('\n🎉 Hoàn thành import!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

// Export products từ database ra JSON
async function exportProductsToJSON() {
    try {
        console.log('📤 Export sản phẩm từ database...');
        
        const { data: products, error } = await supabase
            .from('products')
            .select('name, category, price, image, description, badge, sold, status')
            .eq('status', 'active')
            .order('name');
            
        if (error) {
            console.log('❌ Lỗi lấy sản phẩm:', error.message);
            return;
        }
        
        const exportData = {
            products: products,
            exported_at: new Date().toISOString(),
            total_products: products.length
        };
        
        const exportPath = path.join(__dirname, '../data/products_export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
        
        console.log(`✅ Đã export ${products.length} sản phẩm ra file: ${exportPath}`);
        
    } catch (error) {
        console.error('❌ Lỗi export:', error);
    }
}

// Chạy script
const command = process.argv[2];

if (command === 'import') {
    importProductsFromJSON();
} else if (command === 'export') {
    exportProductsToJSON();
} else {
    console.log(`
📁 Quản lý sản phẩm từ file JSON

Cách sử dụng:
  node scripts/import-from-json.js import          # Import từ data/products.json
  node scripts/import-from-json.js import --clear  # Xóa cũ và import mới
  node scripts/import-from-json.js export          # Export ra data/products_export.json

File dữ liệu:
  📄 data/products.json - File template để import
  📄 data/products_export.json - File export từ database
    `);
}