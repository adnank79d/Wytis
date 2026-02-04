
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== VERIFICATION ===\n');

    // Check counts
    const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', targetId);

    const { count: txnCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', targetId);

    const { count: ledgerCount } = await supabase
        .from('ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', targetId);

    const { count: gstCount } = await supabase
        .from('gst_records')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', targetId);

    console.log(`Invoices: ${invoiceCount}`);
    console.log(`Transactions: ${txnCount}`);
    console.log(`Ledger Entries: ${ledgerCount}`);
    console.log(`GST Records: ${gstCount}`);

    if (invoiceCount === 0 && txnCount === 0 && ledgerCount === 0 && gstCount === 0) {
        console.log('\n✅ PERFECT! All financial data is clean.');
        console.log('Your dashboard should now show:');
        console.log('  - Total Revenue: ₹0');
        console.log('  - Net Profit: ₹0');
        console.log('  - Receivables: ₹0');
        console.log('  - GST Payable: ₹0');
    } else {
        console.log('\n⚠️  Some data still remains. Details above.');
    }
}

main().catch(console.error);
