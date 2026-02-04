
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('FORCE WIPING FINANCIAL DATA');
    console.log('='.repeat(80));

    // 1. Delete GST Records
    const { error: gstError } = await supabase
        .from('gst_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete ALL
    console.log('GST Records deleted:', gstError ? gstError.message : '✅');

    // 2. Delete Ledger Entries
    const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Ledger Entries deleted:', ledgerError ? ledgerError.message : '✅');

    // 3. Delete Transactions
    const { error: txnError } = await supabase
        .from('transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Transactions deleted:', txnError ? txnError.message : '✅');

    // 4. Reset Invoices
    const { error: invError } = await supabase
        .from('invoices')
        .update({ status: 'draft', paid_at: null })
        .neq('status', 'draft');
    console.log('Invoices reset:', invError ? invError.message : '✅');

    console.log('\nReady for SQL application!');
}

main().catch(console.error);
