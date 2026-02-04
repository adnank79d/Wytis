
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- SCANNING ALL BUSINESSES ---');

    // 1. Fetch ALL Ledger Entries
    const { data: ledger, error } = await supabase
        .from('ledger_entries')
        .select(`
            business_id, 
            account_name, 
            debit, 
            credit,
            created_at,
            transactions (transaction_date)
        `);

    if (error) {
        console.error(error);
        return;
    }

    // Group by Business ID
    const grouped = {};
    ledger.forEach(e => {
        if (!grouped[e.business_id]) grouped[e.business_id] = [];
        grouped[e.business_id].push(e);
    });

    console.log(`Found ${Object.keys(grouped).length} Businesses in Ledger.`);

    Object.entries(grouped).forEach(([busId, entries]) => {
        console.log(`\n=== Business ID: ${busId} ===`);
        console.log(`Total Entries: ${entries.length}`);

        // Calculate Net Profit & Receivables
        const balances = {};
        entries.forEach(e => {
            const amount = Number(e.credit) - Number(e.debit);
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

        console.log(`Net Profit (Lifetime): ${(income + expense).toFixed(2)}`);
        console.log(`Receivables: ${(balances['Accounts Receivable'] || 0).toFixed(2)}`);
        console.log(`GST Payable: ${(balances['GST Payable'] || 0).toFixed(2)}`);

        // Filter Last Month (Dec 2025)
        const lastMonth = entries.filter(e => {
            const tDate = (e.transactions && e.transactions.transaction_date)
                ? e.transactions.transaction_date
                : e.created_at;
            return tDate >= '2025-12-01' && tDate <= '2025-12-31';
        });

        // Calc Last Month Profit
        let lastInc = 0;
        let lastExp = 0;
        const lastBal = {};
        lastMonth.forEach(e => {
            const amt = Number(e.credit) - Number(e.debit);
            lastBal[e.account_name] = (lastBal[e.account_name] || 0) + amt;
        });
        Object.entries(lastBal).forEach(([acc, val]) => {
            if (excluded.includes(acc)) return;
            if (val > 0) lastInc += val;
            else lastExp += val;
        });
        console.log(`Last Month Profit: ${(lastInc + lastExp).toFixed(2)}`);
    });
}

main().catch(console.error);
