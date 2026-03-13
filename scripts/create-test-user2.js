// Script to create test user
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function createTestUser() {
    try {
        const email = 'test@test.com';
        const password = '123456';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Creating test user...');
        
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            console.log('User exists. Updating password...');
            
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    password: hashedPassword
                })
                .eq('email', email);
            
            if (updateError) throw updateError;
            
            console.log('✅ User updated successfully!');
        } else {
            console.log('Creating new user...');
            
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    name: 'Test User',
                    email: email,
                    phone: '0123456789',
                    password: hashedPassword,
                    role: 'user'
                }])
                .select()
                .single();
            
            if (userError) throw userError;
            
            // Create wallet for user
            await supabase
                .from('wallet')
                .insert([{
                    user_id: newUser.id,
                    balance: 1000000
                }]);
            
            console.log('✅ User created successfully!');
            console.log('User ID:', newUser.id);
        }
        
        console.log('\n========================================');
        console.log('📧 Email: test@test.com');
        console.log('🔑 Password: 123456');
        console.log('👤 Role: user');
        console.log('========================================');
        console.log('\nBạn có thể đăng nhập với tài khoản này!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

createTestUser();
