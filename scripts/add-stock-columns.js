const { supabase } = require('../src/config/supabase');

async function addStockColumns() {
    try {
        console.log('🔧 Adding stock columns to products table...');
        
        // Since we can't add columns directly via Supabase client,
        // we'll need to do this through the Supabase dashboard
        // But first, let's check what columns exist
        
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Error:', error.message);
            return;
        }
        
        if (products.length > 0) {
            console.log('📋 Current product columns:');
            Object.keys(products[0]).forEach(key => {
                console.log(`   - ${key}: ${typeof products[0][key]}`);
            });
        }
        
        console.log('\n⚠️  To add stock columns, you need to:');
        console.log('1. Go to Supabase Dashboard');
        console.log('2. Navigate to Table Editor > products');
        console.log('3. Add these columns:');
        console.log('   - stock (integer, default: 0)');
        console.log('   - stock_status (text, default: "in-stock")');
        console.log('4. Then run the setup script again');
        
    } catch (error) {
        console.error('❌ Failed:', error);
    }
}

addStockColumns();