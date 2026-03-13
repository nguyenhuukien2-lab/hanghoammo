// Script to create custom admin account
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createCustomAdmin() {
    try {
        console.log('\n========================================');
        console.log('   TẠO TÀI KHOẢN ADMIN MỚI');
        console.log('========================================\n');
        
        const name = await question('Nhập tên admin: ');
        const email = await question('Nhập email: ');
        const password = await question('Nhập mật khẩu: ');
        
        if (!name || !email || !password) {
            console.log('❌ Vui lòng điền đầy đủ thông tin!');
            rl.close();
            return;
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('\nĐang kiểm tra tài khoản...');
        
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            console.log('User đã tồn tại. Cập nhật thành admin...');
            
            // Update to admin role
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    password: hashedPassword,
                    role: 'admin',
                    name: name
                })
                .eq('email', email);
            
            if (updateError) throw updateError;
            
            console.log('✅ Đã cập nhật thành admin!');
        } else {
            console.log('Tạo tài khoản admin mới...');
            
            // Create admin user
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    name: name,
                    email: email,
                    phone: '',
                    password: hashedPassword,
                    role: 'admin'
                }])
                .select()
                .single();
            
            if (userError) throw userError;
            
            console.log('✅ Tài khoản admin đã được tạo!');
            console.log('User ID:', newUser.id);
        }
        
        console.log('\n========================================');
        console.log('   THÔNG TIN TÀI KHOẢN ADMIN');
        console.log('========================================');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 Tên:', name);
        console.log('🛡️  Role: admin');
        console.log('========================================');
        console.log('\n✅ Bạn có thể đăng nhập tại:');
        console.log('   http://localhost:3002/admin.html\n');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error('Chi tiết:', error);
    } finally {
        rl.close();
    }
}

createCustomAdmin();
