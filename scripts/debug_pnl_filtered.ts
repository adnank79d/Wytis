
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- TARGETED P&L DEBUG ---');

    // 1. Get Businesses
    const { data: businesses } = await supabase.from('businesses').select('id, name');
    if (!businesses) return;

    const now = new Date('2026-01-29'); // Hardcoded to match user context
    const startOfMonth = '2026-01-01';
    const startOfLastMonth = '2025-12-01';
    const endOfLastMonth = '2025-12-31';

    for (const bus of businesses) {
        console.log(`\n=== Business: ${bus.name} (${bus.id}) ===`);

        // 2. Fetch Ledger Entries
        const { data: ledger } = await supabase
            .from('ledger_entries')
            .select('account_name, debit, credit, created_at, transaction_id, transactions(transaction_date)')
            .eq('business_id', bus.id);

        if (!ledger) continue;

        // Helper to calculate P&L from entries
        const calcPnL = (entries: any[], label: string) => {
            const balances: Record<string, number> = {};
            entries.forEach(e => {
                const amount = Number(e.credit) - Number(e.debit); // Revenue is Credit (+), Expense is Debit (-)
                balances[e.account_name] = (balances[e.account_name] || 0) + amount;
            });

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
            console.log(`Expense Components: ${expenseDetails}`);
        };

        // Filter for THIS MONTH
        const thisMonthEntries = ledger.filter(e => {
            const date = e.transactions?.transaction_date || e.created_at; // Use transaction date if available (from polymorphic join, tricky in JS client if flattened, checking structure below)
            // Actually, Supabase returns array if joined. Let's assume transaction_date exists or fallback.
            // Or simpler: filter in JS.
            // Wait, 'transactions' is an object?
            const tDate = (e.transactions as any)?.transaction_date || e.created_at;
            return tDate >= startOfMonth;
        });

        calcPnL(thisMonthEntries, 'THIS MONTH (Jan 2026)');

        // Filter for LAST MONTH
        const lastMonthEntries = ledger.filter(e => {
            const tDate = (e.transactions as any)?.transaction_date || e.created_at;
            return tDate >= startOfLastMonth && tDate <= endOfLastMonth;
        });

        calcPnL(lastMonthEntries, 'LAST MONTH (Dec 2025)');

        // Check Receivables (Non-Time Bound, Balance Sheet)
        const receivables = ledger
            .filter(e => e.account_name === 'Accounts Receivable')
            .reduce((sum, e) => sum + (Number(e.debit) - Number(e.credit)), 0); // Asset: Dr - Cr

        console.log(`\nReceivables Balance: ${receivables.toFixed(2)}`);
    }
}

main().catch(console.error);
