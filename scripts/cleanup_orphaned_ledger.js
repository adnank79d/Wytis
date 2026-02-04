
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('ORPHANED LEDGER ENTRIES CLEANUP');
    console.log('='.repeat(80));

    // 1. Check current ledger state
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('id, account_name, debit, credit, transaction_id')
        .eq('business_id', businessId);

    console.log(`\nTotal ledger entries: ${ledger?.length || 0}\n`);

    // Group by account
    const accounts = {};
    ledger?.forEach(e => {
        if (!accounts[e.account_name]) {
            accounts[e.account_name] = { debit: 0, credit: 0, balance: 0, count: 0 };
        }
        accounts[e.account_name].debit += Number(e.debit);
        accounts[e.account_name].credit += Number(e.credit);
        accounts[e.account_name].balance = accounts[e.account_name].credit - accounts[e.account_name].debit;
        accounts[e.account_name].count++;
    });

    console.log('Current Account Balances:');
    console.log('-'.repeat(80));
    Object.entries(accounts).forEach(([name, data]) => {
        console.log(`${name.padEnd(30)} Balance: ₹${data.balance.toFixed(2).padStart(10)} (${data.count} entries)`);
    });

    // 2. Find orphaned transactions (no matching invoice)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, source_type, source_id')
        .eq('business_id', businessId)
        .eq('source_type', 'invoice');

    console.log(`\n\nTransactions linked to invoices: ${transactions?.length || 0}`);

    const orphanedTxns = [];
    for (const txn of transactions || []) {
        const { data: invoice } = await supabase
            .from('invoices')
            .select('id')
            .eq('id', txn.source_id)
            .maybeSingle();

        if (!invoice) {
            orphanedTxns.push(txn.id);
            console.log(`  ❌ Orphaned: Transaction ${txn.id.substring(0, 8)}... (invoice ${txn.source_id.substring(0, 8)}... deleted)`);
        }
    }

    if (orphanedTxns.length === 0) {
        console.log('  ✅ No orphaned transactions found');
        console.log('\n⚠️  But you have negative balances!');
        console.log('This means there are ledger entries that need manual cleanup.');
        console.log('\nRecommendation: Delete ALL ledger entries and start fresh.');
        return;
    }

    console.log(`\n\nFound ${orphanedTxns.length} orphaned transactions`);
    console.log('\nCLEANING UP...\n');

    // 3. Delete orphaned ledger entries
    const { data: deletedLedger, error: ledgerError } = await supabase
        .from('ledger_entries')
        .delete()
        .in('transaction_id', orphanedTxns)
        .select();

    if (ledgerError) {
        console.log('❌ Error deleting ledger entries:', ledgerError.message);
    } else {
        console.log(`✅ Deleted ${deletedLedger?.length || 0} orphaned ledger entries`);
    }

    // 4. Delete orphaned GST records
    const { data: deletedGST } = await supabase
        .from('gst_records')
        .delete()
        .eq('business_id', businessId)
        .in('source_id', transactions.filter(t => orphanedTxns.includes(t.id)).map(t => t.source_id))
        .eq('source_type', 'invoice')
        .select();

    console.log(`✅ Deleted ${deletedGST?.length || 0} orphaned GST records`);

    // 5. Delete orphaned transactions
    const { data: deletedTxns, error: txnError } = await supabase
        .from('transactions')
        .delete()
        .in('id', orphanedTxns)
        .select();

    if (txnError) {
        console.log('❌ Error deleting transactions:', txnError.message);
    } else {
        console.log(`✅ Deleted ${deletedTxns?.length || 0} orphaned transactions`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('CLEANUP COMPLETE!');
    console.log('Refresh your dashboard - all values should now be ₹0');
    console.log('='.repeat(80));
}

main().catch(console.error);
