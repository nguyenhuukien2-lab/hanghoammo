const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function debugDepositRequests() {
    console.log('🔍 Debugging Deposit Requests...\n');
    
    try {
        // 1. Check if deposit_requests table exists and has data
        console.log('1. Checking deposit_requests table...');
        const { data: deposits, error: depositsError } = await supabase
            .from('deposit_requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (depositsError) {
            console.error('❌ Error fetching deposits:', depositsError);
            return;
        }
        
        console.log(`✅ Found ${deposits.length} deposit requests`);
        
        if (deposits.length > 0) {
            console.log('\n📋 Deposit Requests:');
            deposits.forEach((dep, index) => {
                console.log(`${index + 1}. ID: ${dep.id}`);
                console.log(`   User ID: ${dep.user_id}`);
                console.log(`   Amount: ${dep.amount}`);
                console.log(`   Status: ${dep.status}`);
                console.log(`   Created: ${dep.created_at}`);
                console.log(`   Payment Method: ${dep.payment_method}`);
                console.log(`   Transaction Code: ${dep.transaction_code}`);
                console.log('   ---');
            });
        }
        
        // 2. Check admin API endpoint
        console.log('\n2. Testing admin API endpoint...');
        const { data: adminDeposits, error: adminError } = await supabase
            .from('deposit_requests')
            .select(`
                *,
                users (id, name, email, phone)
            `)
            .order('created_at', { ascending: false });
        
        if (adminError) {
            console.error('❌ Error with admin query:', adminError);
            return;
        }
        
        console.log(`✅ Admin query returned ${adminDeposits.length} records`);
        
        // 3. Check users table
        console.log('\n3. Checking users table...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .limit(5);
        
        if (usersError) {
            console.error('❌ Error fetching users:', usersError);
            return;
        }
        
        console.log(`✅ Found ${users.length} users`);
        users.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
        
        // 4. Create a test deposit request
        console.log('\n4. Creating test deposit request...');
        const testUser = users.find(u => u.role === 'user');
        
        if (testUser) {
            const { data: testDeposit, error: testError } = await supabase
                .from('deposit_requests')
                .insert([{
                    user_id: testUser.id,
                    amount: 100000,
                    payment_method: 'bank_transfer',
                    transaction_code: 'TEST_' + Date.now(),
                    status: 'pending',
                    note: 'Test deposit request from debug script'
                }])
                .select()
                .single();
            
            if (testError) {
                console.error('❌ Error creating test deposit:', testError);
            } else {
                console.log('✅ Created test deposit request:', testDeposit.id);
            }
        } else {
            console.log('⚠️ No regular user found to create test deposit');
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

debugDepositRequests();