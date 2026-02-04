
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== CLEANUP ORPHANED VOID TRANSACTIONS ===\n');

    // Step 1: Find all invoice transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, source_id, transaction_type, amount, description')
        .eq('business_id', targetId)
        .eq('source_type', 'invoice');

    console.log(`Total Invoice Transactions: ${transactions.length}`);

    // Step 2: Get all valid invoice IDs
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('business_id', targetId);

    const validInvoiceIds = new Set(invoices.map(i => i.id));
    console.log(`Valid Invoices: ${invoices.length}\n`);

    // Step 3: Find orphaned transactions
    const orphanedTxns = transactions.filter(t => !validInvoiceIds.has(t.source_id));

    console.log(`Orphaned Invoice Transactions: ${orphanedTxns.length}`);
    orphanedTxns.forEach(t => {
        console.log(`  ID: ${t.id.substring(0, 8)}... | Type: ${t.transaction_type} | Amt: ${t.amount} | ${t.description || ''}`);
    });

    if (orphanedTxns.length > 0) {
        console.log(`\n⚠️  CLEANUP REQUIRED ⚠️`);
        console.log(`\nThe following will be deleted:`);
        console.log(`- ${orphanedTxns.length} orphaned transactions`);
        console.log(`- Associated ledger entries (will cascade)`);
        console.log(`- Associated GST records (will cascade)`);

        // Perform cleanup
        const orphanedIds = orphanedTxns.map(t => t.id);

        // Delete ledger entries first (they reference transactions)
        const { data: deletedLedger, error: ledgerError } = await supabase
            .from('ledger_entries')
            .delete()
            .in('transaction_id', orphanedIds)
            .select();

        if (ledgerError) {
            console.error('\n❌ Error deleting ledger entries:', ledgerError);
            return;
        }
        console.log(`\n✅ Deleted ${deletedLedger?.length || 0} ledger entries`);

        // Delete GST records
        const { data: deletedGST, error: gstError } = await supabase
            .from('gst_records')
            .delete()
            .in('transaction_id', orphanedIds)
            .select();

        if (gstError) {
            console.error('❌ Error deleting GST records:', gstError);
            return;
        }
        console.log(`✅ Deleted ${deletedGST?.length || 0} GST records`);

        // Delete transactions
        const { data: deletedTxns, error: txnError } = await supabase
            .from('transactions')
            .delete()
            .in('id', orphanedIds)
            .select();

        if (txnError) {
            console.error('❌ Error deleting transactions:', txnError);
            return;
        }
        console.log(`✅ Deleted ${deletedTxns?.length || 0} transactions`);

        console.log(`\n✅ CLEANUP COMPLETE!`);
    } else {
        console.log(`\n✅ No cleanup needed - all transactions are valid`);
    }
}

main().catch(console.error);
