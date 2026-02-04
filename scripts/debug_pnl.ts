
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

    ledger.forEach(entry => {
        const amount = Number(entry.credit) - Number(entry.debit);
        balances[entry.account_name] = (balances[entry.account_name] || 0) + amount;

        if (!transactions[entry.account_name]) transactions[entry.account_name] = [];
        transactions[entry.account_name].push({
            tId: entry.transaction_id.substring(0, 8),
            dr: entry.debit,
            cr: entry.credit,
            date: entry.created_at
        });
    });

    console.log('\n--- ACCOUNT BALANCES (Credit - Debit) ---');
    // Positive = Income/Liability/Equity
    // Negative = Expense/Asset
    console.table(Object.entries(balances).map(([k, v]) => ({ Account: k, Balance: v.toFixed(2) })));

    console.log('\n--- NET PROFIT CALCULATION ---');
    const excluded = [
        'Accounts Receivable', 'Bank', 'Cash', 'Inventory',
        'Accounts Payable', 'GST Payable', 'GST Input Credit',
        'Capital', 'Create Capital', 'Retained Earnings', 'Opening Balance Equity'
    ];

    let income = 0;
    let expense = 0;

    Object.entries(balances).forEach(([acc, val]) => {
        if (excluded.includes(acc)) return;

        if (acc === 'Sales' || acc === 'Other Income') {
            income += val;
        } else {
            // Expenses are naturally Debit (negative in Cr-Dr), so we add them (they are negative numbers)
            expense += val;
        }
    });

    console.log(`Income: ${income.toFixed(2)}`);
    console.log(`Expenses (Negative): ${expense.toFixed(2)}`);
    console.log(`Net Profit: ${(income + expense).toFixed(2)}`);
}

main().catch(console.error);
