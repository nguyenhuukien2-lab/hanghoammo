// Test order creation
require('dotenv').config();
const supabase = require('./config/supabase');

async function testOrder() {
    try {
        console.log('=== TESTING ORDER FLOW ===\n');
        
        // 1. Get a test user
        console.log('1. Getting test user...');
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'huukiennguyen711@gmail.com')
            .single();
        
        if (userError) throw userError;
        console.log('✅ User found:', user.email, 'ID:', user.id);
        
        // 2. Check wallet
        console.log('\n2. Checking wallet...');
        const { data: wallet, error: walletError } = await supabase
            .from('wallet')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (walletError) throw walletError;
        console.log('✅ Wallet balance:', wallet.balance);
        
        // 3. Get products
        console.log('\n3. Getting products...');
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .limit(2);
        
        if (productsError) throw productsError;
        console.log('✅ Found', products.length, 'products');
        products.forEach(p => {
            console.log('  -', p.name, '| ID:', p.id, '| Price:', p.price);
        });
        
        // 4. Check if we have enough balance
        const testProduct = products[0];
        console.log('\n4. Testing with product:', testProduct.name);
        console.log('   Price:', testProduct.price);
        console.log('   Wallet balance:', wallet.balance);
        
        if (wallet.balance < testProduct.price) {
            console.log('⚠️  Insufficient balance! Need to add money first.');
            console.log('   Adding 100,000 to wallet...');
            
            const { error: updateError } = await supabase
                .from('wallet')
                .update({ balance: 100000 })
                .eq('user_id', user.id);
            
            if (updateError) throw updateError;
            console.log('✅ Wallet updated to 100,000');
        } else {
            console.log('✅ Sufficient balance');
        }
        
        // 5. Check for available accounts
        console.log('\n5. Checking available accounts for product...');
        const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('product_id', testProduct.id)
            .eq('status', 'available')
            .limit(1);
        
        if (accountsError) throw accountsError;
        
        if (accounts && accounts.length > 0) {
            console.log('✅ Found', accounts.length, 'available account(s)');
        } else {
            console.log('⚠️  No available accounts. Order will be created without account.');
        }
        
        console.log('\n=== TEST SUMMARY ===');
        console.log('✅ User exists and has wallet');
        console.log('✅ Products are available with UUID');
        console.log('✅ Ready to test order creation');
        console.log('\nYou can now test checkout on the website!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

testOrder();
