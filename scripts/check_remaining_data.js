
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('CHECKING FOR REMAINING FINANCIAL DATA');
    console.log('='.repeat(80));

    // Check ledger entries
    const { data: ledger, count: ledgerCount } = await supabase
        .from('ledger_entries')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId);

    console.log(`\nLedger Entries: ${ledgerCount}`);
    if (ledgerCount > 0) {
        console.log('❌ Ledger entries still exist!');
        ledger.forEach(e => {
            console.log(`  ${e.account_name}: Dr ₹${e.debit}, Cr ₹${e.credit}`);
        });
    }

    // Check transactions
    const { data: txns, count: txnCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId);

    console.log(`\nTransactions: ${txnCount}`);
    if (txnCount > 0) {
        console.log('❌ Transactions still exist!');
        txns.forEach(t => {
            console.log(`  ${t.source_type} - ₹${t.amount} (${t.description || 'no desc'})`);
        });
    }

    // Check GST records
    const { data: gst, count: gstCount } = await supabase
        .from('gst_records')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId);

    console.log(`\nGST Records: ${gstCount}`);

    // Check dashboard view directly
    console.log('\n' + '='.repeat(80));
    console.log('DASHBOARD VIEW QUERY:');
    console.log('='.repeat(80));

    const { data: metrics } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    console.log('\nDashboard Metrics:');
    console.log(JSON.stringify(metrics, null, 2));

    if (metrics && (metrics.revenue > 0 || metrics.ar > 0)) {
        console.log('\n❌ PROBLEM: Dashboard showing non-zero values!');
        console.log('\nPossible causes:');
        console.log('1. Ledger entries not fully deleted');
        console.log('2. View is cached (try refreshing materialized view)');
        console.log('3. Reset script didn\'t run completely');
    } else {
        console.log('\n✅ Dashboard correctly shows zeros');
    }
}

main().catch(console.error);
