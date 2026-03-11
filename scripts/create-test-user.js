// Script to create test user
require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function createTestUser() {
    try {
        const email = 'test@hanghoammo.com';
        const password = 'test123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Creating test user...');
        
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            console.log('✅ Test user already exists!');
            console.log('\n========================================');
            console.log('📧 Email: test@hanghoammo.com');
            console.log('🔑 Password: test123');
            console.log('========================================');
            return;
        }
        
        // Create test user
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
        
        console.log('✅ Test user created successfully!');
        console.log('User ID:', newUser.id);
        
        console.log('\n========================================');
        console.log('📧 Email: test@hanghoammo.com');
        console.log('🔑 Password: test123');
        console.log('========================================');
        console.log('\nBạn có thể đăng nhập với tài khoản này để test!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

createTestUser();
