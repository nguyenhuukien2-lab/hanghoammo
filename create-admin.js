// Script to create admin account
require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function createAdmin() {
    try {
        const email = 'admin@hanghoammo.com';
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Checking admin account...');
        
        // Check if admin exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            console.log('Admin exists. Updating password and role...');
            
            // Update password and role
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    password: hashedPassword,
                    role: 'admin',
                    name: 'Admin'
                })
                .eq('email', email);
            
            if (updateError) throw updateError;
            
            console.log('✅ Admin password and role updated successfully!');
        } else {
            console.log('Creating new admin account...');
            
            // Create admin user
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    name: 'Admin',
                    email: email,
                    phone: '0879062222',
                    password: hashedPassword,
                    role: 'admin'
                }])
                .select()
                .single();
            
            if (userError) throw userError;
            
            // Create wallet for admin
            const { error: walletError } = await supabase
                .from('wallet')
                .insert([{
                    user_id: newUser.id,
                    balance: 0
                }]);
            
            if (walletError) throw walletError;
            
            console.log('✅ Admin account created successfully!');
        }
        
        console.log('\n========================================');
        console.log('📧 Email: admin@hanghoammo.com');
        console.log('🔑 Password: Admin@123');
        console.log('========================================');
        console.log('\nBạn có thể đăng nhập với tài khoản này!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createAdmin();
