
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '4fba4eb7-83fa-4e92-9c8c-0882e9fcb7fc';
    console.log(`Targeting: ${targetId}`);

    // 1. Fetch ALL
    const { data: ledger, error } = await supabase
        .from('ledger_entries')
        .select('business_id, account_name, debit, credit');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total Rows in DB: ${ledger.length}`);

    const matches = ledger.filter(e => e.business_id === targetId);
    console.log(`JS Filter Match Count: ${matches.length}`);

    if (matches.length === 0) {
        console.log('Comparing IDs:');
        const unique = [...new Set(ledger.map(e => e.business_id))];
        unique.forEach(uid => {
            console.log(`DB ID: '${uid}' (Len: ${uid.length})`);
            console.log(`Target: '${targetId}' (Len: ${targetId.length})`);
            console.log(`Equal? ${uid === targetId}`);
        });
    } else {
        // If matches found, calculate receivables to confirm data quality
        const receivables = matches
            .filter(e => e.account_name === 'Accounts Receivable')
            .reduce((sum, e) => sum + (Number(e.debit) - Number(e.credit)), 0);
        console.log(`Receivables (JS Filter): ${receivables}`);
    }
}

main().catch(console.error);
