
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== TESTING DASHBOARD METRICS VIEW ===\n');

    const { data, error } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    if (error) {
        console.error('❌ Error querying view:', error.message);
        console.log('\nThe view may not exist yet. Please run the SQL manually in Supabase:');
        console.log('File: supabase/migrations/20260130000002_dashboard_metrics_view.sql');
        return;
    }

    if (!data) {
        console.log('No data found for this business.');
        return;
    }

    console.log('✅ Dashboard Metrics View is working!\n');
    console.log('=== INCOME STATEMENT ===');
    console.log(`Total Revenue:        ₹${Number(data.total_revenue).toFixed(2)}`);
    console.log(`COGS:                 ₹${Number(data.cogs).toFixed(2)}`);
    console.log(`Gross Profit:         ₹${Number(data.gross_profit).toFixed(2)}`);
    console.log(`Operating Expenses:   ₹${Number(data.operating_expenses).toFixed(2)}`);
    console.log(`Net Profit:           ₹${Number(data.net_profit).toFixed(2)}`);

    console.log('\n=== BALANCE SHEET ===');
    console.log(`Accounts Receivable:  ₹${Number(data.accounts_receivable).toFixed(2)}`);
    console.log(`Accounts Payable:     ₹${Number(data.accounts_payable).toFixed(2)}`);
    console.log(`Inventory Value:      ₹${Number(data.inventory_value).toFixed(2)}`);
    console.log(`Bank Balance:         ₹${Number(data.bank_balance).toFixed(2)}`);
    console.log(`Cash Balance:         ₹${Number(data.cash_balance).toFixed(2)}`);
    console.log(`Total Cash:           ₹${Number(data.total_cash).toFixed(2)}`);

    console.log('\n=== GST ===');
    console.log(`GST Output:           ₹${Number(data.gst_output).toFixed(2)}`);
    console.log(`GST Input:            ₹${Number(data.gst_input).toFixed(2)}`);
    console.log(`GST Payable:          ₹${Number(data.gst_payable).toFixed(2)}`);
}

main().catch(console.error);
