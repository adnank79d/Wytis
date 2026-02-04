
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    // Check Sales ledger entries
    const { data: salesEntries } = await supabase
        .from('ledger_entries')
        .select('debit, credit, created_at, transaction_id')
        .eq('business_id', targetId)
        .eq('account_name', 'Sales');

    console.log('=== SALES LEDGER ENTRIES ===');
    console.log(`Total entries: ${salesEntries.length}\n`);

    let totalDebit = 0;
    let totalCredit = 0;

    salesEntries.forEach(e => {
        totalDebit += Number(e.debit);
        totalCredit += Number(e.credit);
        console.log(`Dr: ${e.debit.toString().padStart(10)} | Cr: ${e.credit.toString().padStart(10)} | ${e.created_at}`);
    });

    console.log(`\nTotal Debit: ${totalDebit}`);
    console.log(`Total Credit: ${totalCredit}`);
    console.log(`Net (Cr - Dr): ${totalCredit - totalDebit}`);
    console.log('\nNote: Sales should normally have CREDIT entries (revenue)');
    console.log('If net is negative, it means more debits than credits - which is wrong for a revenue account');
}

main().catch(console.error);
