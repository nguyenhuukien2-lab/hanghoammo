const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function createTestDeposit() {
    console.log('🔄 Creating test deposit request...\n');
    
    try {
        // Get a regular user
        const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('role', 'user')
            .limit(1);
        
        if (!users || users.length === 0) {
            console.log('❌ No regular user found');
            return;
        }
        
        const user = users[0];
        console.log(`👤 Using user: ${user.name} (${user.email})`);
        
        // Create pending deposit request
        const { data: deposit, error } = await supabase
            .from('deposit_requests')
            .insert([{
                user_id: user.id,
                amount: 500000,
                payment_method: 'vietinbank',
                transaction_code: 'TEST_PENDING_' + Date.now(),
                status: 'pending',
                note: 'Test deposit - Chuyển khoản VietinBank - Cần admin duyệt'
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating deposit:', error);
            return;
        }
        
        console.log('✅ Created pending deposit request:');
        console.log(`   ID: ${deposit.id}`);
        console.log(`   Amount: ${deposit.amount.toLocaleString('vi-VN')} VNĐ`);
        console.log(`   Status: ${deposit.status}`);
        console.log(`   Transaction Code: ${deposit.transaction_code}`);
        console.log(`   Created: ${deposit.created_at}`);
        
        console.log('\n🎯 Admin should now see this pending request!');
        console.log('   Go to: http://localhost:3001/admin → Quản lý nạp tiền');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createTestDeposit();