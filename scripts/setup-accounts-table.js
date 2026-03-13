const { supabase } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

async function setupAccountsTable() {
    try {
        console.log('🔧 Setting up accounts table...');
        
        // Read SQL file
        const sqlPath = path.join(__dirname, '../database/create-accounts-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute SQL (note: Supabase client doesn't support raw SQL directly)
        // You need to run this SQL in Supabase Dashboard SQL Editor
        
        console.log('📝 SQL to run in Supabase Dashboard:');
        console.log('=====================================');
        console.log(sql);
        console.log('=====================================');
        console.log('\n✅ Please run the above SQL in your Supabase Dashboard > SQL Editor');
        console.log('   URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

setupAccountsTable();
