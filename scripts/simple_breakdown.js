
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    const balances = {};
    ledger.forEach(e => {
        const amount = Number(e.credit) - Number(e.debit);
        balances[e.account_name] = (balances[e.account_name] || 0) + amount;
    });

    const excluded = ['Accounts Receivable', 'Bank', 'Cash', 'Inventory', 'Accounts Payable', 'GST Payable', 'GST Input Credit', 'Capital', 'Create Capital', 'Retained Earnings', 'Opening Balance Equity'];

    console.log('EXPENSES (Negative Balances):');
    Object.entries(balances)
        .filter(([acc, val]) => !excluded.includes(acc) && val < 0)
        .sort((a, b) => a[1] - b[1])
        .forEach(([acc, val]) => console.log(`${acc}: ${val.toFixed(2)}`));

    console.log('\nINCOME (Positive Balances):');
    Object.entries(balances)
        .filter(([acc, val]) => !excluded.includes(acc) && val > 0)
        .forEach(([acc, val]) => console.log(`${acc}: ${val.toFixed(2)}`));

    const income = Object.values(balances).filter((v, i) => !excluded.includes(Object.keys(balances)[i]) && v > 0).reduce((s, v) => s + v, 0);
    const expense = Object.values(balances).filter((v, i) => !excluded.includes(Object.keys(balances)[i]) && v < 0).reduce((s, v) => s + v, 0);

    console.log(`\nTotal Income: ${income.toFixed(2)}`);
    console.log(`Total Expense: ${expense.toFixed(2)}`);
    console.log(`Net Profit: ${(income + expense).toFixed(2)}`);
}

main().catch(console.error);
