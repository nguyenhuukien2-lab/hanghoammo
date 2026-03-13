const { supabase } = require('../src/config/supabase');

async function testStockUpdate() {
    try {
        console.log('🧪 Testing stock update...');
        
        // Get first product
        const { data: products, error: getError } = await supabase
            .from('products')
            .select('id, name, stock')
            .limit(1);
            
        if (getError) {
            console.log('❌ Error getting products:', getError.message);
            return;
        }
        
        if (products.length === 0) {
            console.log('❌ No products found');
            return;
        }
        
        const product = products[0];
        console.log('📦 Product:', product.name);
        console.log('📊 Current stock:', product.stock);
        
        // Try to update stock
        const newStock = 50;
        const { data: updateData, error: updateError } = await supabase
            .from('products')
            .update({ 
                stock: newStock,
                stock_status: 'in-stock'
            })
            .eq('id', product.id)
            .select();
            
        if (updateError) {
            console.log('❌ Update error:', updateError.message);
            console.log('❌ Error details:', updateError);
        } else {
            console.log('✅ Update successful!');
            console.log('📊 New data:', updateData);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testStockUpdate();