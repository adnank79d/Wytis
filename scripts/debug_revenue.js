
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    // Check P&L View
    const { data: pnl } = await supabase
        .from('profit_and_loss_view')
        .select('account_name, category, net_amount')
        .eq('business_id', targetId);

    console.log('=== P&L VIEW DATA ===');
    pnl.forEach(r => {
        console.log(`${r.account_name.padEnd(25)} | ${r.category.padEnd(10)} | ${r.net_amount}`);
    });

    const salesRecord = pnl.find(r => r.account_name === 'Sales');
    const otherIncomeRecord = pnl.find(r => r.account_name === 'Other Income');

    console.log('\n=== REVENUE CALCULATION ===');
    console.log(`Sales: ${salesRecord?.net_amount || 0}`);
    console.log(`Other Income: ${otherIncomeRecord?.net_amount || 0}`);
    console.log(`Total Revenue: ${Number(salesRecord?.net_amount || 0) + Number(otherIncomeRecord?.net_amount || 0)}`);
}

main().catch(console.error);
