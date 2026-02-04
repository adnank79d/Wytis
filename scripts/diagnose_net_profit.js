const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('NET PROFIT DIAGNOSTIC');
    console.log('='.repeat(80));

    // 1. Check all ledger entries
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', businessId)
        .order('account_name');

    console.log('\n1. ALL LEDGER ENTRIES:');
    const accountSummary = {};
    ledger?.forEach(e => {
        if (!accountSummary[e.account_name]) {
            accountSummary[e.account_name] = { debit: 0, credit: 0 };
        }
        accountSummary[e.account_name].debit += Number(e.debit);
        accountSummary[e.account_name].credit += Number(e.credit);
    });

    Object.entries(accountSummary).forEach(([account, totals]) => {
        const balance = totals.debit - totals.credit;
        console.log(`  ${account}: Dr ${totals.debit.toFixed(2)}, Cr ${totals.credit.toFixed(2)}, Balance: ${balance.toFixed(2)}`);
    });

    // 2. Check P&L View
    const { data: pl } = await supabase
        .from('profit_and_loss_view')
        .select('*')
        .eq('business_id', businessId);

    console.log('\n2. PROFIT & LOSS VIEW:');
    pl?.forEach(row => {
        console.log(`  ${row.account_name} (${row.category}): ${row.net_amount}`);
    });

    // 3. Check Net Profit View
    const { data: np } = await supabase
        .from('net_profit_view')
        .select('*')
        .eq('business_id', businessId)
        .single();

    console.log('\n3. NET PROFIT VIEW:');
    console.log(`  Total Income: ${np?.total_income || 0}`);
    console.log(`  Total Expense: ${np?.total_expense || 0}`);
    console.log(`  Net Profit: ${np?.net_profit || 0}`);

    // 4. Manual calculation
    const revenue = accountSummary['Sales'] ? (accountSummary['Sales'].credit - accountSummary['Sales'].debit) : 0;

    let totalExpenses = 0;
    Object.entries(accountSummary).forEach(([account, totals]) => {
        // Expense accounts should have debit balance
        if (!['Sales', 'Accounts Receivable', 'Bank', 'Cash', 'Inventory', 'Accounts Payable',
            'Output CGST', 'Output SGST', 'Output IGST', 'Input CGST', 'Input SGST', 'Input IGST',
            'GST Input Credit', 'GST Payable', 'Capital', 'Retained Earnings'].includes(account)) {
            const expenseAmount = totals.debit - totals.credit;
            if (expenseAmount > 0) {
                totalExpenses += expenseAmount;
                console.log(`\n  Found expense account: ${account} = ${expenseAmount}`);
            }
        }
    });

    console.log('\n4. MANUAL CALCULATION:');
    console.log(`  Revenue (Sales Credit - Debit): ${revenue.toFixed(2)}`);
    console.log(`  Total Expenses (Debit - Credit): ${totalExpenses.toFixed(2)}`);
    console.log(`  Net Profit (Revenue - Expenses): ${(revenue - totalExpenses).toFixed(2)}`);

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');
    if (Math.abs((np?.net_profit || 0) - (revenue - totalExpenses)) > 0.01) {
        console.log('❌ Net Profit view is INCORRECT!');
        console.log('   The P&L view is not capturing expense accounts properly.');
    } else {
        console.log('✅ Net Profit calculation is correct!');
    }
}

main().catch(console.error);
