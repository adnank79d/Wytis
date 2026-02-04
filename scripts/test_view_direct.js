
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('DIRECT VIEW TEST FOR USER\'S BUSINESS');
    console.log('='.repeat(80));

    // Get user's business ID
    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, businesses(name)')
        .limit(1)
        .single();

    const businessId = membership.business_id;
    const businessName = membership.businesses?.name;

    console.log(`\nTesting for business: ${businessName} (${businessId})\n`);

    // Test each view individually
    console.log('1. REVENUE VIEW:');
    const { data: revenue, error: revError } = await supabase
        .from('revenue_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    console.log('   Data:', revenue);
    console.log('   Error:', revError);

    console.log('\n2. ACCOUNTS RECEIVABLE VIEW:');
    const { data: ar, error: arError } = await supabase
        .from('accounts_receivable_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    console.log('   Data:', ar);
    console.log('   Error:', arError);

    console.log('\n3. NET PROFIT VIEW:');
    const { data: profit, error: profitError } = await supabase
        .from('net_profit_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    console.log('   Data:', profit);
    console.log('   Error:', profitError);

    console.log('\n4. DASHBOARD METRICS VIEW:');
    const { data: dashboard, error: dashError } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

    console.log('   Data:', dashboard);
    console.log('   Error:', dashError);

    console.log('\n5. LEDGER ENTRIES (raw):');
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', businessId)
        .limit(5);

    console.log('   Sample entries:', ledger);

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');

    if (dashError) {
        console.log('❌ View has an error:', dashError.message);
    } else if (!dashboard) {
        console.log('❌ View returns NULL');
        console.log('This means the view query is not finding any data for this business_id');
        console.log('Even though ledger entries exist!');
        console.log('\nPossible causes:');
        console.log('1. View uses INNER JOIN and one of the tables is empty');
        console.log('2. View has WHERE clause that filters out this business');
        console.log('3. View was not created/applied correctly');
    } else if (dashboard.total_revenue === 0) {
        console.log('⚠️  View returns data but all zeros');
        console.log('This means the view logic is incorrect');
    } else {
        console.log('✅ View returns correct data!');
        console.log('The issue must be in how the frontend calls the backend');
    }
}

main().catch(console.error);
