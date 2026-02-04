
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';
    console.log('=== JS TRADING COMPANY P&L ANALYSIS ===\n');

    // Fetch all ledger entries
    const { data: ledger, error } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit, created_at, transactions(transaction_date)')
        .eq('business_id', targetId);

    if (error) return console.error(error);

    console.log(`Total Ledger Entries: ${ledger.length}\n`);

    // Calculate balances
    const balances = {};
    ledger.forEach(e => {
        const amount = Number(e.credit) - Number(e.debit);
        balances[e.account_name] = (balances[e.account_name] || 0) + amount;
    });

    // Display all account balances
    console.log('--- ALL ACCOUNT BALANCES ---');
    Object.entries(balances)
        .sort((a, b) => b[1] - a[1])
        .forEach(([acc, val]) => {
            console.log(`${acc.padEnd(30)} ${val.toFixed(2).padStart(12)}`);
        });

    // Calculate P&L
    const excluded = [
        'Accounts Receivable', 'Bank', 'Cash', 'Inventory',
        'Accounts Payable', 'GST Payable', 'GST Input Credit',
        'Capital', 'Create Capital', 'Retained Earnings', 'Opening Balance Equity'
    ];

    let income = 0;
    let expense = 0;

    console.log('\n--- P&L BREAKDOWN ---');
    console.log('\nINCOME ACCOUNTS:');
    Object.entries(balances).forEach(([acc, val]) => {
        if (excluded.includes(acc)) return;
        if (val > 0) {
            income += val;
            console.log(`  ${acc.padEnd(28)} ${val.toFixed(2).padStart(12)}`);
        }
    });
    console.log(`  ${'TOTAL INCOME'.padEnd(28)} ${income.toFixed(2).padStart(12)}`);

    console.log('\nEXPENSE ACCOUNTS:');
    Object.entries(balances).forEach(([acc, val]) => {
        if (excluded.includes(acc)) return;
        if (val < 0) {
            expense += val;
            console.log(`  ${acc.padEnd(28)} ${val.toFixed(2).padStart(12)}`);
        }
    });
    console.log(`  ${'TOTAL EXPENSES'.padEnd(28)} ${expense.toFixed(2).padStart(12)}`);

    const netProfit = income + expense;
    console.log(`\n${'NET PROFIT'.padEnd(30)} ${netProfit.toFixed(2).padStart(12)}`);

    // Check GST
    console.log('\n--- GST ANALYSIS ---');
    console.log(`GST Payable Balance: ${(balances['GST Payable'] || 0).toFixed(2)}`);
    console.log(`GST Input Credit: ${(balances['GST Input Credit'] || 0).toFixed(2)}`);

    // Check Receivables
    console.log('\n--- RECEIVABLES ---');
    console.log(`Accounts Receivable: ${(balances['Accounts Receivable'] || 0).toFixed(2)}`);
}

main().catch(console.error);
