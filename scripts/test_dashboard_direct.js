
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardFunction() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('TESTING DASHBOARD METRICS FUNCTION');
    console.log('='.repeat(80));

    // Test exactly what dashboard.ts does
    const { data: metrics, error: metricsError } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    console.log('\n1. Query Result:');
    console.log('  Error:', metricsError);
    console.log('  Has Data:', !!metrics);

    if (metrics) {
        console.log('\n2. Raw Metrics from View:');
        console.log(JSON.stringify(metrics, null, 2));

        console.log('\n3. Extracted Values (what dashboard.ts does):');
        const revenue = Number(metrics?.total_revenue || 0);
        const netProfit = Number(metrics?.net_profit || 0);
        const gstPayable = Number(metrics?.gst_payable || 0);
        const receivables = Number(metrics?.accounts_receivable || 0);
        const payables = Number(metrics?.accounts_payable || 0);
        const cashBalance = Number(metrics?.net_cash || 0);

        console.log(`  revenue: ${revenue}`);
        console.log(`  netProfit: ${netProfit}`);
        console.log(`  gstPayable: ${gstPayable}`);
        console.log(`  receivables: ${receivables}`);
        console.log(`  payables: ${payables}`);
        console.log(`  cashBalance: ${cashBalance}`);

        console.log('\n4. What Dashboard Should Show:');
        console.log(`  Total Revenue: ₹${revenue}`);
        console.log(`  Net Profit: ₹${netProfit}`);
        console.log(`  Receivables: ₹${receivables}`);
        console.log(`  GST Payable: ₹${gstPayable}`);
    } else {
        console.log('\n❌ NO DATA RETURNED!');
        console.log('This is why dashboard shows ₹0');

        // Check if view exists
        const { data: testView, error: testError } = await supabase
            .from('dashboard_metrics_view')
            .select('*')
            .limit(1);

        if (testError) {
            console.log('\n❌ VIEW DOES NOT EXIST!');
            console.log('Error:', testError.message);
            console.log('\n⚠️  YOU MUST RUN THE SQL IN SUPABASE!');
            console.log('File: scripts/FINANCIAL_SYSTEM_COMPLETE.sql');
        } else {
            console.log('\n⚠️  View exists but returns no data for this business');
            console.log('This means there are no ledger entries for business:', targetId);
        }
    }
}

testDashboardFunction().catch(console.error);
