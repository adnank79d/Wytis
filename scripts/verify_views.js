
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('DASHBOARD METRICS FROM SQL VIEWS');
    console.log('='.repeat(50));

    const { data, error } = await supabase
        .from('dashboard_metrics_view')
        .select('*')
        .eq('business_id', targetId)
        .maybeSingle();

    if (error) {
        console.log('ERROR:', error.message);
        return;
    }

    if (!data) {
        console.log('No data found');
        return;
    }

    console.log('Revenue:     ', data.total_revenue);
    console.log('Net Profit:  ', data.net_profit);
    console.log('AR:          ', data.accounts_receivable);
    console.log('AP:          ', data.accounts_payable);
    console.log('GST Payable: ', data.gst_payable);
    console.log('Cash:        ', data.net_cash);
    console.log('\nVIEWS ARE WORKING!');
}

main().catch(console.error);
