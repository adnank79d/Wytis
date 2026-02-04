
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('CURRENT STATE CHECK');
    console.log('='.repeat(60));

    // Check invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_number, status, subtotal, total_amount')
        .eq('business_id', targetId)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\nINVOICES:');
    if (invoices && invoices.length > 0) {
        invoices.forEach(inv => {
            console.log(`  ${inv.invoice_number} - ${inv.status.toUpperCase()} - ₹${inv.total_amount}`);
        });
    } else {
        console.log('  No invoices found');
    }

    // Check ledger entries
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    console.log(`\nLEDGER ENTRIES: ${ledger?.length || 0} total`);

    if (ledger && ledger.length > 0) {
        const accounts = {};
        ledger.forEach(e => {
            if (!accounts[e.account_name]) {
                accounts[e.account_name] = { debit: 0, credit: 0 };
            }
            accounts[e.account_name].debit += Number(e.debit);
            accounts[e.account_name].credit += Number(e.credit);
        });

        Object.entries(accounts).forEach(([name, data]) => {
            const balance = data.credit - data.debit;
            console.log(`  ${name}: ₹${balance.toFixed(2)}`);
        });
    }

    // Check dashboard metrics view
    const { data: metrics, error } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    console.log('\nDASHBOARD METRICS VIEW:');
    if (error) {
        console.log(`  ERROR: ${error.message}`);
    } else if (!metrics) {
        console.log('  No data (all zeros)');
    } else {
        console.log(`  Revenue:     ₹${metrics.total_revenue}`);
        console.log(`  Net Profit:  ₹${metrics.net_profit}`);
        console.log(`  AR:          ₹${metrics.accounts_receivable}`);
        console.log(`  GST Payable: ₹${metrics.gst_payable}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS:');

    const draftCount = invoices?.filter(i => i.status === 'draft').length || 0;
    const issuedCount = invoices?.filter(i => i.status === 'issued').length || 0;

    if (draftCount > 0 && issuedCount === 0) {
        console.log('⚠️  You have DRAFT invoices but none are ISSUED');
        console.log('');
        console.log('ACTION REQUIRED:');
        console.log('1. Go to Invoices page');
        console.log('2. Click on your draft invoice');
        console.log('3. Click "Issue Invoice" button');
        console.log('4. This will create ledger entries');
        console.log('5. Dashboard will update immediately');
    } else if (issuedCount > 0 && (!ledger || ledger.length === 0)) {
        console.log('❌ CRITICAL: Issued invoices but NO ledger entries!');
        console.log('This means the invoice issuance trigger is not working.');
    } else if (issuedCount > 0 && ledger && ledger.length > 0) {
        console.log('✅ Invoices issued and ledger entries exist');
        console.log('Dashboard should be showing data.');
    } else {
        console.log('ℹ️  No invoices created yet');
    }
}

main().catch(console.error);
