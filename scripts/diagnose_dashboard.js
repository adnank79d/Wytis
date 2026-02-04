
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('COMPREHENSIVE DASHBOARD DIAGNOSTIC');
    console.log('='.repeat(80));

    // 1. Check if views exist
    console.log('\n1. CHECKING IF VIEWS EXIST...');
    const { data: views, error: viewsError } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .limit(1);

    if (viewsError) {
        console.log('❌ dashboard_metrics_view does NOT exist!');
        console.log('Error:', viewsError.message);
        console.log('\n⚠️  YOU NEED TO RUN THE SQL IN SUPABASE!');
        console.log('File: scripts/FINANCIAL_SYSTEM_COMPLETE.sql');
        return;
    } else {
        console.log('✅ dashboard_metrics_view exists');
    }

    // 2. Query the view for this business
    console.log('\n2. QUERYING VIEW FOR YOUR BUSINESS...');
    const { data: metrics, error: metricsError } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    if (metricsError) {
        console.log('❌ Error querying view:', metricsError.message);
        return;
    }

    if (!metrics) {
        console.log('⚠️  View returned NULL (no data for this business)');
        console.log('This means there are NO ledger entries for this business.');
    } else {
        console.log('✅ View returned data:');
        console.log(JSON.stringify(metrics, null, 2));
    }

    // 3. Check ledger entries directly
    console.log('\n3. CHECKING LEDGER ENTRIES DIRECTLY...');
    const { data: ledger, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    if (ledgerError) {
        console.log('❌ Error:', ledgerError.message);
    } else if (!ledger || ledger.length === 0) {
        console.log('❌ NO LEDGER ENTRIES FOUND!');
        console.log('\nThis means:');
        console.log('- Invoices are NOT creating ledger entries');
        console.log('- The invoice issuance code is broken');
    } else {
        console.log(`✅ Found ${ledger.length} ledger entries`);

        const accounts = {};
        ledger.forEach(e => {
            if (!accounts[e.account_name]) {
                accounts[e.account_name] = { debit: 0, credit: 0, count: 0 };
            }
            accounts[e.account_name].debit += Number(e.debit);
            accounts[e.account_name].credit += Number(e.credit);
            accounts[e.account_name].count++;
        });

        console.log('\nAccount Balances:');
        Object.entries(accounts).forEach(([name, data]) => {
            const balance = data.credit - data.debit;
            console.log(`  ${name.padEnd(25)} ${balance.toFixed(2).padStart(10)} (${data.count} entries)`);
        });
    }

    // 4. Check invoices
    console.log('\n4. CHECKING INVOICES...');
    const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_number, status, subtotal, total_amount, created_at')
        .eq('business_id', targetId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (!invoices || invoices.length === 0) {
        console.log('❌ NO INVOICES FOUND');
    } else {
        console.log(`✅ Found ${invoices.length} invoices (showing last 5):`);
        invoices.forEach(inv => {
            console.log(`  ${inv.invoice_number} - ${inv.status.toUpperCase()} - ₹${inv.total_amount}`);
        });

        const issued = invoices.filter(i => i.status === 'issued' || i.status === 'paid');
        console.log(`\n  Issued/Paid: ${issued.length}`);
        console.log(`  Draft: ${invoices.filter(i => i.status === 'draft').length}`);
    }

    // 5. Simulate what dashboard.ts does
    console.log('\n5. SIMULATING DASHBOARD.TS QUERY...');
    const { data: dashMetrics, error: dashError } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    if (dashError) {
        console.log('❌ Dashboard query failed:', dashError.message);
    } else if (!dashMetrics) {
        console.log('⚠️  Dashboard query returned NULL');
        console.log('This is why dashboard shows ₹0!');
    } else {
        console.log('✅ Dashboard query succeeded:');
        console.log(`  Revenue:     ₹${dashMetrics.total_revenue}`);
        console.log(`  Net Profit:  ₹${dashMetrics.net_profit}`);
        console.log(`  AR:          ₹${dashMetrics.accounts_receivable}`);
        console.log(`  GST Payable: ₹${dashMetrics.gst_payable}`);
    }

    // 6. Final diagnosis
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(80));

    if (viewsError) {
        console.log('❌ VIEWS NOT CREATED - Run SQL in Supabase!');
    } else if (!ledger || ledger.length === 0) {
        console.log('❌ NO LEDGER ENTRIES - Invoices not creating accounting records!');
        console.log('\nACTION: Check lib/actions/invoices.ts - issueInvoice function');
    } else if (!dashMetrics) {
        console.log('❌ VIEW RETURNS NULL - Check view logic');
    } else if (Number(dashMetrics.total_revenue) === 0) {
        console.log('❌ VIEW RETURNS ZEROS - Check account names in ledger vs view');
    } else {
        console.log('✅ EVERYTHING LOOKS GOOD!');
        console.log('\nIf dashboard still shows ₹0:');
        console.log('1. Hard refresh browser (Ctrl+Shift+R)');
        console.log('2. Check browser console for errors (F12)');
        console.log('3. Restart dev server');
    }
}

main().catch(console.error);
