
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== FINDING ORPHANED LEDGER ENTRIES ===\n');

    // Get all ledger entries
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('id, transaction_id, account_name, debit, credit')
        .eq('business_id', targetId);

    console.log(`Total Ledger Entries: ${ledger.length}`);

    // Get all valid transaction IDs
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('business_id', targetId);

    const validTxnIds = new Set(transactions.map(t => t.id));
    console.log(`Valid Transactions: ${transactions.length}\n`);

    // Find orphaned ledger entries
    const orphaned = ledger.filter(l => !validTxnIds.has(l.transaction_id));

    console.log(`Orphaned Ledger Entries: ${orphaned.length}\n`);

    if (orphaned.length > 0) {
        // Group by account
        const byAccount = {};
        orphaned.forEach(l => {
            if (!byAccount[l.account_name]) {
                byAccount[l.account_name] = { count: 0, debit: 0, credit: 0, ids: [] };
            }
            byAccount[l.account_name].count++;
            byAccount[l.account_name].debit += Number(l.debit);
            byAccount[l.account_name].credit += Number(l.credit);
            byAccount[l.account_name].ids.push(l.id);
        });

        console.log('Orphaned Entries by Account:');
        Object.entries(byAccount).forEach(([acc, data]) => {
            console.log(`\n${acc}:`);
            console.log(`  Count: ${data.count}`);
            console.log(`  Total Debit: ${data.debit}`);
            console.log(`  Total Credit: ${data.credit}`);
            console.log(`  Net Impact: ${data.credit - data.debit}`);
        });

        console.log(`\n\nTO FIX: Delete ${orphaned.length} orphaned ledger entries`);
    }
}

main().catch(console.error);
