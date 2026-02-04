
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('LEDGER ANALYSIS');
    console.log('='.repeat(80));

    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    console.log(`\nTotal Entries: ${ledger.length}\n`);

    // Group by account
    const accounts = {};
    ledger.forEach(e => {
        if (!accounts[e.account_name]) {
            accounts[e.account_name] = { debit: 0, credit: 0, count: 0 };
        }
        accounts[e.account_name].debit += Number(e.debit);
        accounts[e.account_name].credit += Number(e.credit);
        accounts[e.account_name].count++;
    });

    console.log('Account'.padEnd(30), 'Debit'.padStart(12), 'Credit'.padStart(12), 'Balance'.padStart(12), 'Count');
    console.log('-'.repeat(80));

    Object.entries(accounts).sort().forEach(([name, data]) => {
        const balance = data.credit - data.debit;
        console.log(
            name.padEnd(30),
            data.debit.toFixed(2).padStart(12),
            data.credit.toFixed(2).padStart(12),
            balance.toFixed(2).padStart(12),
            data.count.toString().padStart(5)
        );
    });

    // Calculate totals
    const totalDebit = Object.values(accounts).reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = Object.values(accounts).reduce((sum, a) => sum + a.credit, 0);

    console.log('-'.repeat(80));
    console.log(
        'TOTALS'.padEnd(30),
        totalDebit.toFixed(2).padStart(12),
        totalCredit.toFixed(2).padStart(12),
        (totalCredit - totalDebit).toFixed(2).padStart(12)
    );

    console.log('\nDOUBLE-ENTRY CHECK:');
    console.log(`Total Debits:  ${totalDebit.toFixed(2)}`);
    console.log(`Total Credits: ${totalCredit.toFixed(2)}`);
    console.log(`Difference:    ${(totalDebit - totalCredit).toFixed(2)}`);
    console.log(totalDebit === totalCredit ? '✅ BALANCED' : '❌ NOT BALANCED');

    // Test individual views
    console.log('\n' + '='.repeat(80));
    console.log('VIEW RESULTS');
    console.log('='.repeat(80));

    const views = [
        'revenue_view',
        'accounts_receivable_view',
        'accounts_payable_view',
        'gst_payable_view',
        'cash_flow_view',
        'net_profit_view'
    ];

    for (const viewName of views) {
        const { data, error } = await supabase
            .from(viewName)
            .select('*')
            .eq('business_id', targetId)
            .maybeSingle();

        if (error) {
            console.log(`\n${viewName}: ERROR - ${error.message}`);
        } else if (!data) {
            console.log(`\n${viewName}: No data`);
        } else {
            console.log(`\n${viewName}:`);
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

main().catch(console.error);
