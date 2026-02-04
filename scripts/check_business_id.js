
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('BUSINESS ID INVESTIGATION');
    console.log('='.repeat(80));

    // 1. Find all businesses
    const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name');

    console.log('\n1. ALL BUSINESSES:');
    businesses?.forEach(b => {
        console.log(`  ${b.id} - ${b.name}`);
    });

    // 2. Check which business has ledger data
    console.log('\n2. BUSINESSES WITH LEDGER DATA:');
    for (const business of businesses || []) {
        const { data: ledger } = await supabase
            .from('ledger_entries')
            .select('id')
            .eq('business_id', business.id)
            .limit(1);

        if (ledger && ledger.length > 0) {
            console.log(`  ✅ ${business.id} (${business.name}) - HAS LEDGER DATA`);

            // Check view for this business
            const { data: metrics } = await supabase
                .from('dashboard_metrics_view')
                .select('*')
                .eq('business_id', business.id)
                .maybeSingle();

            if (metrics) {
                console.log(`     Revenue: ₹${metrics.total_revenue}`);
                console.log(`     Net Profit: ₹${metrics.net_profit}`);
            } else {
                console.log(`     ⚠️  View returns NULL for this business`);
            }
        } else {
            console.log(`  ❌ ${business.id} (${business.name}) - NO LEDGER DATA`);
        }
    }

    // 3. Check memberships
    console.log('\n3. USER MEMBERSHIPS:');
    const { data: memberships } = await supabase
        .from('memberships')
        .select('user_id, business_id, role');

    memberships?.forEach(m => {
        console.log(`  User: ${m.user_id.substring(0, 8)}... → Business: ${m.business_id.substring(0, 8)}... (${m.role})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');
    console.log('If the business with ledger data is DIFFERENT from the user\'s membership,');
    console.log('that\'s why dashboard shows ₹0!');
}

main().catch(console.error);
