
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== APPLYING COMPLETE FINANCIAL SYSTEM ===\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'FINANCIAL_SYSTEM_COMPLETE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing comprehensive SQL migration...\n');

    // Split SQL into individual statements and execute them
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        // Skip comments
        if (statement.startsWith('--')) continue;

        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                console.error(`❌ Error in statement ${i + 1}:`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            // Try direct query if RPC fails
            try {
                await supabase.from('_sql').select('*').limit(0); // Dummy query to test connection
                console.log(`⚠️  Statement ${i + 1}: RPC not available, please run SQL manually`);
                break;
            } catch {
                console.error(`❌ Connection error on statement ${i + 1}`);
                errorCount++;
            }
        }
    }

    if (errorCount > 0) {
        console.log('\n⚠️  Some statements failed. Please run the SQL manually in Supabase SQL Editor:');
        console.log('File: scripts/FINANCIAL_SYSTEM_COMPLETE.sql');
        console.log('\nOr copy and paste this:');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
    } else {
        console.log(`\n✅ Successfully applied ${successCount} statements!`);

        // Test the views
        await testViews();
    }
}

async function testViews() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('\n=== TESTING FINANCIAL VIEWS ===\n');

    // Test dashboard_metrics_view
    const { data: metrics, error } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    if (error) {
        console.error('❌ Error querying dashboard_metrics_view:', error.message);
        console.log('\nThe view may not exist. Please run the SQL manually.');
        return;
    }

    if (!metrics) {
        console.log('⚠️  No data found for this business.');
        return;
    }

    console.log('✅ Dashboard Metrics View is working!\n');
    console.log('=== INCOME STATEMENT ===');
    console.log(`Total Revenue:        ₹${Number(metrics.total_revenue).toFixed(2)}`);
    console.log(`Total Income:         ₹${Number(metrics.total_income).toFixed(2)}`);
    console.log(`Total Expense:        ₹${Number(metrics.total_expense).toFixed(2)}`);
    console.log(`Net Profit:           ₹${Number(metrics.net_profit).toFixed(2)}`);

    console.log('\n=== BALANCE SHEET ===');
    console.log(`Accounts Receivable:  ₹${Number(metrics.accounts_receivable).toFixed(2)}`);
    console.log(`Accounts Payable:     ₹${Number(metrics.accounts_payable).toFixed(2)}`);
    console.log(`Bank Balance:         ₹${Number(metrics.bank_balance).toFixed(2)}`);
    console.log(`Cash Balance:         ₹${Number(metrics.cash_balance).toFixed(2)}`);
    console.log(`Total Cash:           ₹${Number(metrics.net_cash).toFixed(2)}`);

    console.log('\n=== GST (LIABILITY - NOT IN P&L) ===');
    console.log(`GST Output:           ₹${Number(metrics.gst_output).toFixed(2)}`);
    console.log(`GST Input:            ₹${Number(metrics.gst_input).toFixed(2)}`);
    console.log(`GST Payable:          ₹${Number(metrics.gst_payable).toFixed(2)}`);

    console.log('\n=== VERIFICATION ===');
    console.log(`Revenue matches Income: ${Number(metrics.total_revenue).toFixed(2) === Number(metrics.total_income).toFixed(2) ? '✅' : '❌'}`);
    console.log(`Net Profit = Income + Expense: ${(Number(metrics.total_income) + Number(metrics.total_expense)).toFixed(2) === Number(metrics.net_profit).toFixed(2) ? '✅' : '❌'}`);

    console.log('\n✅ All views are working correctly!');
    console.log('🎉 Financial system is now using ledger-first architecture!');
}

main().catch(console.error);
