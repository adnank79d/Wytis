
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    // Get all Sales ledger entries with transaction details
    const { data: salesEntries } = await supabase
        .from('ledger_entries')
        .select(`
      debit, 
      credit, 
      created_at,
      transactions (
        transaction_type,
        source_type,
        description,
        amount
      )
    `)
        .eq('business_id', targetId)
        .eq('account_name', 'Sales')
        .order('created_at', { ascending: true });

    console.log('=== COMPLETE SALES HISTORY ===\n');

    let runningBalance = 0;
    salesEntries.forEach((e, i) => {
        const dr = Number(e.debit);
        const cr = Number(e.credit);
        const net = cr - dr;
        runningBalance += net;

        const txn = e.transactions;
        console.log(`Entry ${i + 1}:`);
        console.log(`  Debit: ${dr} | Credit: ${cr} | Net: ${net}`);
        console.log(`  Type: ${txn?.transaction_type || 'N/A'} | Source: ${txn?.source_type || 'N/A'}`);
        console.log(`  Description: ${txn?.description || 'N/A'}`);
        console.log(`  Running Balance: ${runningBalance}`);
        console.log('');
    });

    console.log(`\nFINAL SALES BALANCE: ${runningBalance}`);
    console.log('\nNote: Sales should have positive balance (credits > debits)');
    console.log('Negative balance means more voids/returns than actual sales');
}

main().catch(console.error);
