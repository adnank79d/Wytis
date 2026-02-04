
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId)
        .order('account_name');

    console.log('=== ALL LEDGER ENTRIES ===\n');

    const grouped = {};
    ledger.forEach(e => {
        if (!grouped[e.account_name]) {
            grouped[e.account_name] = { debit: 0, credit: 0, count: 0 };
        }
        grouped[e.account_name].debit += Number(e.debit);
        grouped[e.account_name].credit += Number(e.credit);
        grouped[e.account_name].count++;
    });

    Object.entries(grouped).forEach(([acc, data]) => {
        const net = data.credit - data.debit;
        console.log(`${acc.padEnd(30)} | Dr: ${data.debit.toFixed(2).padStart(8)} | Cr: ${data.credit.toFixed(2).padStart(8)} | Net: ${net.toFixed(2).padStart(8)} | (${data.count} entries)`);
    });
}

main().catch(console.error);
