// Script to create custom admin account
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function createMyAdmin() {
    try {
        const email = 'huukiennguyen711@gmail.com';
        const password = '12345678';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Checking admin account...');
        
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            console.log('User exists. Updating to admin role...');
            
            // Update to admin role
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    password: hashedPassword,
                    role: 'admin',
                    name: 'Nguyễn Hữu Kiên'
                })
                .eq('email', email);
            
            if (updateError) throw updateError;
            
            console.log('✅ User updated to admin successfully!');
        } else {
            console.log('Creating new admin account...');
            
            // Create admin user
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    name: 'Nguyễn Hữu Kiên',
                    email: email,
                    phone: '',
                    password: hashedPassword,
                    role: 'admin'
                }])
                .select()
                .single();
            
            if (userError) throw userError;
            
            console.log('✅ Admin account created successfully!');
            console.log('User ID:', newUser.id);
        }
        
        console.log('\n========================================');
        console.log('📧 Email: huukiennguyen711@gmail.com');
        console.log('🔑 Password: 12345678');
        console.log('👤 Role: admin');
        console.log('========================================');
        console.log('\nBạn có thể đăng nhập với tài khoản này!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

createMyAdmin();
