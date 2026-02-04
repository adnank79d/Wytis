
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('⚠️  COMPLETE FINANCIAL DATA RESET');
    console.log('='.repeat(80));
    console.log('This will DELETE ALL:');
    console.log('  - Ledger entries');
    console.log('  - Transactions');
    console.log('  - GST records');
    console.log('  - Invoices (keeping them but resetting to draft)');
    console.log('');
    console.log('Business ID:', businessId);
    console.log('='.repeat(80));

    // 1. Count current records
    const { count: ledgerCount } = await supabase
        .from('ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

    const { count: txnCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

    const { count: gstCount } = await supabase
        .from('gst_records')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

    const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

    console.log('\nCurrent Records:');
    console.log(`  Ledger Entries: ${ledgerCount}`);
    console.log(`  Transactions: ${txnCount}`);
    console.log(`  GST Records: ${gstCount}`);
    console.log(`  Invoices: ${invoiceCount}`);

    console.log('\nDeleting...\n');

    // 2. Delete in correct order (children first)

    // Delete ledger entries
    const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .delete()
        .eq('business_id', businessId);

    if (ledgerError) {
        console.log('❌ Error deleting ledger entries:', ledgerError.message);
        return;
    }
    console.log(`✅ Deleted all ledger entries`);

    // Delete GST records
    const { error: gstError } = await supabase
        .from('gst_records')
        .delete()
        .eq('business_id', businessId);

    if (gstError) {
        console.log('❌ Error deleting GST records:', gstError.message);
    } else {
        console.log(`✅ Deleted all GST records`);
    }

    // Delete transactions
    const { error: txnError } = await supabase
        .from('transactions')
        .delete()
        .eq('business_id', businessId);

    if (txnError) {
        console.log('❌ Error deleting transactions:', txnError.message);
        return;
    }
    console.log(`✅ Deleted all transactions`);

    // Reset invoices to draft (optional - keeps invoice data but resets status)
    const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'draft' })
        .eq('business_id', businessId)
        .neq('status', 'draft');

    if (invoiceError) {
        console.log('⚠️  Could not reset invoices:', invoiceError.message);
    } else {
        console.log(`✅ Reset all invoices to draft status`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ RESET COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nYour dashboard should now show:');
    console.log('  Revenue: ₹0');
    console.log('  Net Profit: ₹0');
    console.log('  Receivables: ₹0');
    console.log('  All other metrics: ₹0');
    console.log('\nYou can now:');
    console.log('  1. Create new invoices');
    console.log('  2. Issue them (this creates ledger entries)');
    console.log('  3. See accurate financial data on dashboard');
    console.log('='.repeat(80));
}

main().catch(console.error);
