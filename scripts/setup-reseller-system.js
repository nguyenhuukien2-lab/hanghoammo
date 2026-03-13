const { supabase } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

async function setupResellerSystem() {
    try {
        console.log('🚀 Setting up Reseller System...');
        
        // Read SQL file
        const sqlFile = path.join(__dirname, '../database/create-reseller-system.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split SQL into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        console.log(`📝 Found ${statements.length} SQL statements`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                    
                    if (error) {
                        console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
                        // Continue with other statements
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (err) {
                    console.log(`⚠️  Statement ${i + 1} error:`, err.message);
                    // Continue with other statements
                }
            }
        }
        
        // Verify setup by checking if tables exist
        console.log('\n🔍 Verifying setup...');
        
        const tables = [
            'tier_config',
            'api_keys', 
            'api_logs',
            'referrals',
            'commission_history',
            'tier_upgrade_history'
        ];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Table ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Table ${table}: OK`);
                }
            } catch (err) {
                console.log(`❌ Table ${table}: ${err.message}`);
            }
        }
        
        // Check if tier_config has data
        const { data: tierData, error: tierError } = await supabase
            .from('tier_config')
            .select('*');
            
        if (tierError) {
            console.log('❌ Error checking tier_config:', tierError.message);
        } else {
            console.log(`✅ Tier config has ${tierData.length} tiers`);
            tierData.forEach(tier => {
                console.log(`   - ${tier.display_name}: ${tier.discount_percent}% discount, ${tier.commission_percent}% commission`);
            });
        }
        
        // Update existing users to have default tier
        console.log('\n🔄 Updating existing users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, user_tier')
            .is('user_tier', null);
            
        if (usersError) {
            console.log('❌ Error getting users:', usersError.message);
        } else if (users.length > 0) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ user_tier: 'member', total_spent: 0 })
                .is('user_tier', null);
                
            if (updateError) {
                console.log('❌ Error updating users:', updateError.message);
            } else {
                console.log(`✅ Updated ${users.length} users to member tier`);
            }
        } else {
            console.log('✅ All users already have tiers assigned');
        }
        
        console.log('\n🎉 Reseller System setup completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Visit /reseller.html to access the dashboard');
        console.log('2. Users will automatically get Member tier');
        console.log('3. Spend money to auto-upgrade tiers');
        console.log('4. Reseller+ can create API keys');
        console.log('5. All tiers get referral commissions');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup
setupResellerSystem();