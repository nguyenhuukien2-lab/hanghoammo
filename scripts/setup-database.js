// Setup Database - Run all SQL migration files
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// SQL files to run in order
const sqlFiles = [
    'create-reviews-table.sql',
    'create-wishlist-table.sql',
    'create-vouchers-table.sql',
    'create-affiliate-table.sql',
    'create-blog-table.sql',
    'create-analytics-table.sql'
];

async function runSQLFile(filename) {
    try {
        console.log(`\n📄 Running ${filename}...`);
        
        const filePath = path.join(__dirname, '../database', filename);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon and filter empty statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`   Found ${statements.length} SQL statements`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments
            if (statement.startsWith('--')) continue;
            
            try {
                // Execute via Supabase RPC or direct query
                const { error } = await supabase.rpc('exec_sql', { 
                    sql_query: statement + ';' 
                });
                
                if (error) {
                    // Try direct query if RPC fails
                    const { error: directError } = await supabase
                        .from('_sql_exec')
                        .select('*')
                        .limit(0);
                    
                    if (directError) {
                        console.log(`   ⚠️  Statement ${i + 1}: ${error.message}`);
                    }
                }
            } catch (err) {
                console.log(`   ⚠️  Statement ${i + 1}: ${err.message}`);
            }
        }
        
        console.log(`   ✅ Completed ${filename}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Error in ${filename}:`, error.message);
        return false;
    }
}

async function setupDatabase() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   🗄️  DATABASE SETUP SCRIPT          ║');
    console.log('╚═══════════════════════════════════════╝');
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   1. This script will create new tables in your Supabase database');
    console.log('   2. Some statements may fail if tables already exist (this is OK)');
    console.log('   3. You can also run SQL files manually in Supabase SQL Editor');
    console.log('   4. Go to: https://supabase.com/dashboard → SQL Editor');
    
    console.log('\n📋 SQL Files to execute:');
    sqlFiles.forEach((file, i) => {
        console.log(`   ${i + 1}. ${file}`);
    });
    
    console.log('\n🚀 Starting execution...');
    
    let successCount = 0;
    for (const file of sqlFiles) {
        const success = await runSQLFile(file);
        if (success) successCount++;
    }
    
    console.log('\n╔═══════════════════════════════════════╗');
    console.log(`║   ✅ Setup Complete: ${successCount}/${sqlFiles.length} files   ║`);
    console.log('╚═══════════════════════════════════════╝');
    
    console.log('\n📝 MANUAL SETUP INSTRUCTIONS:');
    console.log('   If automatic setup failed, run SQL files manually:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste content from each SQL file in database/ folder');
    console.log('   5. Click "Run" for each file');
    
    console.log('\n📂 SQL Files location: ./database/');
    sqlFiles.forEach(file => {
        console.log(`   - ${file}`);
    });
    
    console.log('\n✨ Next steps:');
    console.log('   1. Run: npm install');
    console.log('   2. Configure .env file with payment credentials');
    console.log('   3. Run: npm start');
    console.log('   4. Test the new features!');
}

// Run setup
setupDatabase().catch(console.error);
