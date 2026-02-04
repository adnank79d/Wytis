
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== CHECKING FOR REMAINING ORPHANED DATA ===\n');

    // Check invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('business_id', targetId);

    console.log(`Invoices: ${invoices.length}`);
    if (invoices.length > 0) {
        invoices.forEach(inv => console.log(`  - ${inv.invoice_number} (${inv.status})`));
    }

    // Check all transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, source_type, source_id, transaction_type, amount, description')
        .eq('business_id', targetId);

    console.log(`\nTransactions: ${transactions.length}`);
    if (transactions.length > 0) {
        transactions.forEach(t => {
            console.log(`  - ${t.source_type} | ${t.transaction_type} | ${t.amount} | ${t.description || 'N/A'}`);
        });
    }

    // Check ledger entries
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    console.log(`\nLedger Entries: ${ledger.length}`);

    // Group by account
    const balances = {};
    ledger.forEach(e => {
        const amount = Number(e.credit) - Number(e.debit);
        balances[e.account_name] = (balances[e.account_name] || 0) + amount;
    });

    console.log('\nAccount Balances:');
    Object.entries(balances).forEach(([acc, val]) => {
        if (Math.abs(val) > 0.01) {
            console.log(`  ${acc}: ${val.toFixed(2)}`);
        }
    });

    // Check GST records
    const { data: gst } = await supabase
        .from('gst_records')
        .select('*')
        .eq('business_id', targetId);

    console.log(`\nGST Records: ${gst?.length || 0}`);

    // If there are transactions but no invoices, they're orphaned
    if (transactions.length > 0 && invoices.length === 0) {
        console.log('\n⚠️  ORPHANED DATA DETECTED!');
        console.log('All transactions should be deleted since there are no invoices.');
        console.log('\nCleaning up...');

        // Delete all ledger entries
        const { data: delLedger } = await supabase
            .from('ledger_entries')
            .delete()
            .eq('business_id', targetId)
            .select();
        console.log(`✅ Deleted ${delLedger?.length || 0} ledger entries`);

        // Delete all GST records
        const { data: delGST } = await supabase
            .from('gst_records')
            .delete()
            .eq('business_id', targetId)
            .select();
        console.log(`✅ Deleted ${delGST?.length || 0} GST records`);

        // Delete all transactions
        const { data: delTxns } = await supabase
            .from('transactions')
            .delete()
            .eq('business_id', targetId)
            .select();
        console.log(`✅ Deleted ${delTxns?.length || 0} transactions`);

        console.log('\n✅ CLEANUP COMPLETE!');
        console.log('Your dashboard should now show all zeros.');
    } else if (transactions.length === 0) {
        console.log('\n✅ No orphaned transactions found!');
        console.log('But there might be orphaned ledger/GST records...');

        if (ledger.length > 0) {
            console.log('\nCleaning up orphaned ledger entries...');
            const { data: delLedger } = await supabase
                .from('ledger_entries')
                .delete()
                .eq('business_id', targetId)
                .select();
            console.log(`✅ Deleted ${delLedger?.length || 0} ledger entries`);
        }

        if (gst && gst.length > 0) {
            console.log('Cleaning up orphaned GST records...');
            const { data: delGST } = await supabase
                .from('gst_records')
                .delete()
                .eq('business_id', targetId)
                .select();
            console.log(`✅ Deleted ${delGST?.length || 0} GST records`);
        }

        console.log('\n✅ CLEANUP COMPLETE!');
    }
}

main().catch(console.error);
