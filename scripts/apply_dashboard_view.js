
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== APPLYING DASHBOARD METRICS VIEW ===\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260130000002_dashboard_metrics_view.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration...\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Error:', error.message);
        console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
    } else {
        console.log('✅ Dashboard metrics view created successfully!');

        // Test the view
        const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';
        const { data: metrics } = await supabase
            .from('dashboard_metrics_view')
            .select('*')
            .eq('business_id', targetId)
            .single();

        if (metrics) {
            console.log('\n=== DASHBOARD METRICS (from SQL view) ===');
            console.log(`Total Revenue: ₹${metrics.total_revenue}`);
            console.log(`COGS: ₹${metrics.cogs}`);
            console.log(`Operating Expenses: ₹${metrics.operating_expenses}`);
            console.log(`Gross Profit: ₹${metrics.gross_profit}`);
            console.log(`Net Profit: ₹${metrics.net_profit}`);
            console.log(`\nAccounts Receivable: ₹${metrics.accounts_receivable}`);
            console.log(`Accounts Payable: ₹${metrics.accounts_payable}`);
            console.log(`GST Payable: ₹${metrics.gst_payable}`);
            console.log(`Bank Balance: ₹${metrics.bank_balance}`);
            console.log(`Cash Balance: ₹${metrics.cash_balance}`);
        }
    }
}

main().catch(console.error);
