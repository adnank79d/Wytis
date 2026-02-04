
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== ORPHANED TRANSACTION ANALYSIS ===\n');

    // Get all transactions for this business
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, source_type, source_id, transaction_type, amount, description')
        .eq('business_id', targetId);

    console.log(`Total Transactions: ${transactions.length}\n`);

    // Check which invoices exist
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('business_id', targetId);

    const invoiceIds = new Set(invoices.map(i => i.id));

    // Find orphaned invoice transactions
    const orphanedInvoiceTxns = transactions.filter(t =>
        t.source_type === 'invoice' && !invoiceIds.has(t.source_id)
    );

    console.log(`Orphaned Invoice Transactions: ${orphanedInvoiceTxns.length}`);
    orphanedInvoiceTxns.forEach(t => {
        console.log(`  ID: ${t.id.substring(0, 8)}... | Type: ${t.transaction_type} | Amount: ${t.amount} | ${t.description || ''}`);
    });

    // Check ledger entries for these orphaned transactions
    if (orphanedInvoiceTxns.length > 0) {
        const orphanedTxnIds = orphanedInvoiceTxns.map(t => t.id);
        const { data: orphanedLedger } = await supabase
            .from('ledger_entries')
            .select('account_name, debit, credit')
            .in('transaction_id', orphanedTxnIds);

        console.log(`\nOrphaned Ledger Entries: ${orphanedLedger.length}`);

        const salesOrphans = orphanedLedger.filter(l => l.account_name === 'Sales');
        const salesOrphanDr = salesOrphans.reduce((s, l) => s + Number(l.debit), 0);
        const salesOrphanCr = salesOrphans.reduce((s, l) => s + Number(l.credit), 0);

        console.log(`\nSales Account Orphaned Entries:`);
        console.log(`  Debits: ${salesOrphanDr}`);
        console.log(`  Credits: ${salesOrphanCr}`);
        console.log(`  Net Impact: ${salesOrphanCr - salesOrphanDr}`);
    }
}

main().catch(console.error);
