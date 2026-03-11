const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkUserDeposits() {
    console.log('🔍 Checking deposits for user: Hừn eiu (phamhuongdn456@gmail.com)\n');
    
    try {
        // 1. Find the user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'phamhuongdn456@gmail.com')
            .single();
        
        if (userError) {
            console.error('❌ Error finding user:', userError);
            return;
        }
        
        if (!user) {
            console.log('❌ User not found!');
            return;
        }
        
        console.log('👤 User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.created_at}\n`);
        
        // 2. Check user's deposit requests
        const { data: deposits, error: depositsError } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (depositsError) {
            console.error('❌ Error fetching deposits:', depositsError);
            return;
        }
        
        console.log(`💰 Deposit requests for this user: ${deposits.length}`);
        
        if (deposits.length === 0) {
            console.log('   ⚠️ No deposit requests found for this user!');
            console.log('   📝 User needs to create a deposit request first.');
        } else {
            console.log('\n📋 Deposit History:');
            deposits.forEach((dep, index) => {
                console.log(`${index + 1}. ID: ${dep.id}`);
                console.log(`   Amount: ${dep.amount.toLocaleString('vi-VN')} VNĐ`);
                console.log(`   Status: ${dep.status}`);
                console.log(`   Payment Method: ${dep.payment_method}`);
                console.log(`   Transaction Code: ${dep.transaction_code}`);
                console.log(`   Note: ${dep.note || 'No note'}`);
                console.log(`   Created: ${dep.created_at}`);
                console.log(`   Updated: ${dep.updated_at}`);
                console.log('   ---');
            });
        }
        
        // 3. Check user's wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallet')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (walletError) {
            console.error('❌ Error fetching wallet:', walletError);
        } else {
            console.log(`\n💳 Wallet Balance: ${wallet.balance.toLocaleString('vi-VN')} VNĐ`);
        }
        
        // 4. Check all pending deposits (what admin should see)
        const { data: allPending, error: pendingError } = await supabase
            .from('deposit_requests')
            .select(`
                *,
                users (id, name, email, phone)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (pendingError) {
            console.error('❌ Error fetching pending deposits:', pendingError);
        } else {
            console.log(`\n⏳ All pending deposits (what admin sees): ${allPending.length}`);
            if (allPending.length > 0) {
                allPending.forEach((dep, index) => {
                    console.log(`${index + 1}. ${dep.users.name} (${dep.users.email}) - ${dep.amount.toLocaleString('vi-VN')} VNĐ`);
                });
            }
        }
        
        // 5. Create a test deposit for this user if none exists
        if (deposits.length === 0) {
            console.log('\n🔄 Creating test deposit request for this user...');
            
            const { data: testDeposit, error: testError } = await supabase
                .from('deposit_requests')
                .insert([{
                    user_id: user.id,
                    amount: 200000,
                    payment_method: 'vietinbank',
                    transaction_code: 'HUNIEU_' + Date.now(),
                    status: 'pending',
                    note: 'Test deposit request - Chuyển khoản VietinBank'
                }])
                .select()
                .single();
            
            if (testError) {
                console.error('❌ Error creating test deposit:', testError);
            } else {
                console.log('✅ Created test deposit request:');
                console.log(`   ID: ${testDeposit.id}`);
                console.log(`   Amount: ${testDeposit.amount.toLocaleString('vi-VN')} VNĐ`);
                console.log(`   Status: ${testDeposit.status}`);
                console.log('   🎯 Admin should now see this in pending list!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkUserDeposits();