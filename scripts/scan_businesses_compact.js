
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: ledger, error } = await supabase.from('ledger_entries').select('business_id, account_name, debit, credit');
    if (error) return console.error(error);

    const grouped = {};
    ledger.forEach(e => {
        if (!grouped[e.business_id]) grouped[e.business_id] = [];
        grouped[e.business_id].push(e);
    });

    console.log(`Scanning ${Object.keys(grouped).length} Businesses:`);

    Object.entries(grouped).forEach(([busId, entries]) => {
        const balances = {};
        entries.forEach(e => {
            const amount = Number(e.credit) - Number(e.debit);
            balances[e.account_name] = (balances[e.account_name] || 0) + amount;
        });

        let income = 0; let expense = 0;
        const excluded = ['Accounts Receivable', 'Bank', 'Cash', 'Inventory', 'Accounts Payable', 'GST Payable', 'GST Input Credit', 'Capital', 'Create Capital', 'Retained Earnings', 'Opening Balance Equity'];

        Object.entries(balances).forEach(([acc, val]) => {
            if (excluded.includes(acc)) return;
            if (val > 0) income += val; else expense += val;
        });

        const netProfit = income + expense;
        const receivables = balances['Accounts Receivable'] || 0;

        console.log(`ID: ${busId} | NP: ${netProfit.toFixed(2)} | AR: ${receivables.toFixed(2)}`);
    });
}

main().catch(console.error);
