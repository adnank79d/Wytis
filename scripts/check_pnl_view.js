
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    const { data: pnl } = await supabase
        .from('profit_and_loss_view')
        .select('*')
        .eq('business_id', targetId);

    console.log('=== P&L VIEW DATA ===\n');
    pnl.forEach(r => {
        console.log(`${r.account_name.padEnd(25)} | ${r.category.padEnd(10)} | ${r.net_amount}`);
    });

    const income = pnl.filter(r => r.category === 'Income').reduce((s, r) => s + Number(r.net_amount), 0);
    const expense = pnl.filter(r => r.category === 'Expense').reduce((s, r) => s + Number(r.net_amount), 0);

    console.log(`\nTotal Income: ${income}`);
    console.log(`Total Expense: ${expense}`);
    console.log(`Net Profit: ${income + expense}`);
}

main().catch(console.error);
