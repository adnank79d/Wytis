
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- P&L BREAKDOWN ---');

    const { data: ledger, error } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit, transaction_id, created_at');

    if (error) {
        console.error(error);
        return;
    }

    const balances: Record<string, number> = {};
    const transactions: Record<string, any[]> = {};

    if (ledger.length > 0) {
        console.log(`First Entry Business ID: ${ledger[0].business_id}`);
    }

    ledger.forEach(entry => {
        // Normal balance for Revenue is Credit (positive here), Expense is Debit (so negative result)
        // Formula: Credit - Debit
        const amount = Number(entry.credit) - Number(entry.debit);
        balances[entry.account_name] = (balances[entry.account_name] || 0) + amount;

        if (!transactions[entry.account_name]) transactions[entry.account_name] = [];
        transactions[entry.account_name].push({
            id: entry.transaction_id.substring(0, 8),
            dr: entry.debit,
            cr: entry.credit
        });
    });

    console.log('\n--- ACCOUNT BALANCES ---');
    Object.entries(balances).forEach(([acc, val]) => {
        console.log(`${acc}: ${val.toFixed(2)}`);
    });

    console.log('\n--- NET PROFIT CHECK ---');
    let income = 0;
    let expense = 0;
    const excluded = [
        'Accounts Receivable', 'Bank', 'Cash', 'Inventory',
        'Accounts Payable', 'GST Payable', 'GST Input Credit',
        'Capital', 'Create Capital', 'Retained Earnings', 'Opening Balance Equity'
    ];

    Object.entries(balances).forEach(([acc, val]) => {
        if (excluded.includes(acc)) return;

        if (val > 0) income += val;
        else expense += val; // val is negative
    });

    console.log(`\nTotal Income: ${income.toFixed(2)}`);
    console.log(`Total Expense: ${expense.toFixed(2)} (This is negative)`);
    console.log(`Net Profit: ${(income + expense).toFixed(2)}`);
}

main().catch(console.error);
