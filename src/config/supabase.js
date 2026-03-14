// Supabase Configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client dùng service_role key - bypass RLS, dùng cho upload ảnh server-side
const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase; // fallback về anon nếu chưa có service key

console.log('✅ Kết nối Supabase thành công!');

module.exports = { supabase, supabaseAdmin };
