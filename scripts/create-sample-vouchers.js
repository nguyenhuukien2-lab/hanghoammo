// Script to create sample vouchers
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function createSampleVouchers() {
    try {
        console.log('Đang tạo vouchers mẫu...\n');
        
        const vouchers = [
            {
                code: 'WELCOME10',
                name: 'Chào mừng khách mới',
                description: 'Giảm 10% cho khách hàng mới',
                type: 'percentage',
                value: 10,
                min_order_amount: 0,
                usage_limit: 100,
                per_user_limit: 1,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                code: 'SUMMER50K',
                name: 'Giảm giá mùa hè',
                description: 'Giảm 50,000đ cho đơn hàng từ 200,000đ',
                type: 'fixed',
                value: 50000,
                min_order_amount: 200000,
                usage_limit: 50,
                per_user_limit: 1,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                code: 'VIP20',
                name: 'Ưu đãi VIP',
                description: 'Giảm 20% cho khách VIP',
                type: 'percentage',
                value: 20,
                min_order_amount: 500000,
                max_discount_amount: 200000,
                usage_limit: 20,
                per_user_limit: 2,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                code: 'FREESHIP',
                name: 'Miễn phí vận chuyển',
                description: 'Miễn phí ship 30,000đ',
                type: 'fixed',
                value: 30000,
                min_order_amount: 100000,
                usage_limit: null,
                per_user_limit: 1,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                code: 'FLASH15',
                name: 'Flash Sale',
                description: 'Flash sale giảm 15%',
                type: 'percentage',
                value: 15,
                min_order_amount: 0,
                max_discount_amount: 100000,
                usage_limit: 200,
                per_user_limit: 1,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            }
        ];
        
        for (const voucher of vouchers) {
            // Check if voucher exists
            const { data: existing } = await supabase
                .from('vouchers')
                .select('*')
                .eq('code', voucher.code)
                .single();
            
            if (existing) {
                console.log(`⏭️  Voucher ${voucher.code} đã tồn tại, bỏ qua...`);
                continue;
            }
            
            // Create voucher
            const { data, error } = await supabase
                .from('vouchers')
                .insert([voucher])
                .select()
                .single();
            
            if (error) {
                console.error(`❌ Lỗi tạo voucher ${voucher.code}:`, error.message);
            } else {
                console.log(`✅ Đã tạo voucher: ${voucher.code} - ${voucher.description}`);
            }
        }
        
        console.log('\n========================================');
        console.log('   DANH SÁCH VOUCHERS');
        console.log('========================================');
        vouchers.forEach(v => {
            console.log(`\n📌 ${v.code}`);
            console.log(`   ${v.description}`);
            console.log(`   Giảm: ${v.type === 'percentage' ? v.value + '%' : v.value.toLocaleString('vi-VN') + 'đ'}`);
            console.log(`   Số lượng: ${v.usage_limit || 'Không giới hạn'}`);
        });
        console.log('\n========================================\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

createSampleVouchers();
