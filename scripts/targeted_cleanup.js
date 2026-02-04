
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== TARGETED CLEANUP FOR JS TRADING COMPANY ===\n');

    // Step 1: Get all Sales ledger entries to see what we're dealing with
    const { data: salesLedger } = await supabase
        .from('ledger_entries')
        .select('id, debit, credit, transaction_id')
        .eq('business_id', targetId)
        .eq('account_name', 'Sales');

    console.log(`Sales Ledger Entries: ${salesLedger.length}`);

    let totalDr = 0, totalCr = 0;
    const txnIds = [];

    salesLedger.forEach(e => {
        totalDr += Number(e.debit);
        totalCr += Number(e.credit);
        txnIds.push(e.transaction_id);
        console.log(`  Dr: ${e.debit} | Cr: ${e.credit} | Txn: ${e.transaction_id.substring(0, 8)}...`);
    });

    console.log(`\nTotal Dr: ${totalDr} | Total Cr: ${totalCr} | Net: ${totalCr - totalDr}`);

    // Step 2: Get the transactions for these ledger entries
    const { data: txns } = await supabase
        .from('transactions')
        .select('id, source_id, source_type, transaction_type, amount, description')
        .in('id', txnIds);

    console.log(`\nTransactions:`);
    txns.forEach(t => {
        console.log(`  ${t.id.substring(0, 8)}... | ${t.source_type} | ${t.transaction_type} | ${t.amount} | ${t.description || 'N/A'}`);
        console.log(`    Source ID: ${t.source_id}`);
    });

    // Step 3: Check which invoices exist
    const sourceIds = [...new Set(txns.map(t => t.source_id))];
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .in('id', sourceIds);

    console.log(`\nInvoices Found: ${invoices.length}`);
    invoices.forEach(inv => {
        console.log(`  ${inv.id} | ${inv.invoice_number} | ${inv.status}`);
    });

    // Step 4: Find orphaned transactions
    const validInvoiceIds = new Set(invoices.map(i => i.id));
    const orphanedTxns = txns.filter(t => !validInvoiceIds.has(t.source_id));

    if (orphanedTxns.length > 0) {
        console.log(`\n⚠️  FOUND ${orphanedTxns.length} ORPHANED TRANSACTIONS:`);
        orphanedTxns.forEach(t => {
            console.log(`  ${t.id} | ${t.description} | Amount: ${t.amount}`);
        });

        // Step 5: Delete orphaned data
        const orphanedTxnIds = orphanedTxns.map(t => t.id);

        console.log(`\nDeleting orphaned data...`);

        // Delete ledger entries
        const { data: delLedger, error: ledgerErr } = await supabase
            .from('ledger_entries')
            .delete()
            .in('transaction_id', orphanedTxnIds)
            .select();

        if (ledgerErr) {
            console.error('Error deleting ledger:', ledgerErr);
            return;
        }
        console.log(`✅ Deleted ${delLedger.length} ledger entries`);

        // Delete GST records
        const { data: delGST, error: gstErr } = await supabase
            .from('gst_records')
            .delete()
            .in('transaction_id', orphanedTxnIds)
            .select();

        if (gstErr) {
            console.error('Error deleting GST:', gstErr);
        } else {
            console.log(`✅ Deleted ${delGST?.length || 0} GST records`);
        }

        // Delete transactions
        const { data: delTxns, error: txnErr } = await supabase
            .from('transactions')
            .delete()
            .in('id', orphanedTxnIds)
            .select();

        if (txnErr) {
            console.error('Error deleting transactions:', txnErr);
            return;
        }
        console.log(`✅ Deleted ${delTxns.length} transactions`);

        console.log(`\n✅ CLEANUP COMPLETE!`);

        // Verify
        const { data: newSales } = await supabase
            .from('ledger_entries')
            .select('debit, credit')
            .eq('business_id', targetId)
            .eq('account_name', 'Sales');

        const newDr = newSales.reduce((s, e) => s + Number(e.debit), 0);
        const newCr = newSales.reduce((s, e) => s + Number(e.credit), 0);

        console.log(`\nVERIFICATION:`);
        console.log(`New Sales Balance: ${newCr - newDr}`);
        console.log(`Expected: 325`);
    } else {
        console.log(`\n✅ No orphaned transactions found`);
    }
}

main().catch(console.error);
