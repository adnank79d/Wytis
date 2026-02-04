
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== COMPLETE SALES TRANSACTION ANALYSIS ===\n');

    // Get all Sales ledger entries with their transactions
    const { data: salesLedger } = await supabase
        .from('ledger_entries')
        .select(`
      id,
      debit,
      credit,
      transaction_id,
      transactions (
        id,
        source_type,
        source_id,
        transaction_type,
        amount,
        description
      )
    `)
        .eq('business_id', targetId)
        .eq('account_name', 'Sales')
        .order('created_at', { ascending: true });

    console.log(`Total Sales Ledger Entries: ${salesLedger.length}\n`);

    salesLedger.forEach((entry, i) => {
        const txn = entry.transactions;
        console.log(`Entry ${i + 1}:`);
        console.log(`  Ledger: Dr ${entry.debit} | Cr ${entry.credit}`);
        console.log(`  Transaction: ${txn.source_type} | ${txn.transaction_type} | Amt: ${txn.amount}`);
        console.log(`  Source ID: ${txn.source_id?.substring(0, 8)}...`);
        console.log(`  Description: ${txn.description || 'N/A'}`);
        console.log('');
    });

    // Summary
    const totalDr = salesLedger.reduce((s, e) => s + Number(e.debit), 0);
    const totalCr = salesLedger.reduce((s, e) => s + Number(e.credit), 0);

    console.log(`\nSUMMARY:`);
    console.log(`Total Debits: ${totalDr}`);
    console.log(`Total Credits: ${totalCr}`);
    console.log(`Net Sales: ${totalCr - totalDr}`);
}

main().catch(console.error);
