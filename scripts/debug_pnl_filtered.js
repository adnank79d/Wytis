
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- TARGETED P&L DEBUG (JS) ---');

    // 1. Get Businesses
    const { data: businesses, error: busError } = await supabase.from('businesses').select('id, name');
    if (busError) {
        console.error(busError);
        return;
    }

    const startOfMonth = '2026-01-01';
    const startOfLastMonth = '2025-12-01';
    const endOfLastMonth = '2025-12-31';

    for (const bus of businesses) {
        console.log(`\n=== Business: ${bus.name} (${bus.id}) ===`);

        // 2. Fetch Ledger Entries WITH Transactions to get dates
        const { data: ledger, error: ledError } = await supabase
            .from('ledger_entries')
            .select(`
            account_name, 
            debit, 
            credit, 
            created_at, 
            transaction_id, 
            transactions (
                transaction_date
            )
        `)
            .eq('business_id', bus.id);

        if (ledError) {
            console.error(ledError);
            continue;
        }

        if (!ledger || ledger.length === 0) {
            console.log('No ledger entries.');
            continue;
        }

        // Helper to calculate P&L
        const calcPnL = (entries, label) => {
            const balances = {};
            entries.forEach(e => {
                const amount = Number(e.credit) - Number(e.debit);
                balances[e.account_name] = (balances[e.account_name] || 0) + amount;
            });

            let income = 0;
            let expense = 0;
            // Excluded from P&L (Balance Sheet items)
            const excluded = [
                'Accounts Receivable', 'Bank', 'Cash', 'Inventory',
                'Accounts Payable', 'GST Payable', 'GST Input Credit',
                'Capital', 'Create Capital', 'Retained Earnings', 'Opening Balance Equity'
            ];

            Object.entries(balances).forEach(([acc, val]) => {
                if (excluded.includes(acc)) return;
                if (val > 0) income += val;
                else expense += val;
            });

            const netProfit = income + expense;
            console.log(`\n[${label}]`);
            console.log(`Income: ${income.toFixed(2)}`);
            console.log(`Expense: ${expense.toFixed(2)}`);
            console.log(`Net Profit: ${netProfit.toFixed(2)}`);

            // Detailed Breakdown of Expense
            const expenseDetails = Object.entries(balances)
                .filter(([acc, val]) => !excluded.includes(acc) && val < 0)
                .map(([acc, val]) => `${acc}: ${val.toFixed(2)}`)
                .join(', ');

            if (expenseDetails) console.log(`Expense Components: ${expenseDetails}`);

            // Detailed Breakdown of Income
            const incomeDetails = Object.entries(balances)
                .filter(([acc, val]) => !excluded.includes(acc) && val > 0)
                .map(([acc, val]) => `${acc}: ${val.toFixed(2)}`)
                .join(', ');

            if (incomeDetails) console.log(`Income Components: ${incomeDetails}`);
        };

        // Filter Logic
        const thisMonthEntries = ledger.filter(e => {
            // Safe access to nested transaction date
            const tDate = (e.transactions && e.transactions.transaction_date)
                ? e.transactions.transaction_date
                : e.created_at;
            return tDate >= startOfMonth;
        });

        const lastMonthEntries = ledger.filter(e => {
            const tDate = (e.transactions && e.transactions.transaction_date)
                ? e.transactions.transaction_date
                : e.created_at;
            return tDate >= startOfLastMonth && tDate <= endOfLastMonth;
        });

        calcPnL(thisMonthEntries, 'THIS MONTH (Jan 2026)');
        calcPnL(lastMonthEntries, 'LAST MONTH (Dec 2025)');

        // Receivables Check
        const receivables = ledger
            .filter(e => e.account_name === 'Accounts Receivable')
            .reduce((sum, e) => sum + (Number(e.debit) - Number(e.credit)), 0);

        console.log(`\nReceivables Balance (Total): ${receivables.toFixed(2)}`);
    }
}

main().catch(console.error);
