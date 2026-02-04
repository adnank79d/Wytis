
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: businesses } = await supabase.from('businesses').select('id');
    if (!businesses) return;

    for (const b of businesses) {
        const { data: inv } = await supabase
            .from('invoices')
            .select('total_amount')
            .eq('business_id', b.id)
            .eq('status', 'issued');

        const total = inv ? inv.reduce((sum, i) => sum + i.total_amount, 0) : 0;
        console.log(`${b.id.substring(0, 8)}... | AR: ${total}`);
    }
}

main().catch(console.error);
