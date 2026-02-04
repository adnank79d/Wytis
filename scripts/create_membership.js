
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const userId = '77130221-4bc4-45f3-a0f1-7296eb108794';

    console.log('FIXING MISSING MEMBERSHIP');
    console.log('='.repeat(80));

    // 1. Check current membership
    const { data: existing } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId);

    console.log(`\n1. Current memberships for user: ${existing?.length || 0}`);

    // 2. Find the business with data
    const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name');

    let targetBusinessId = null;
    let targetBusinessName = null;

    console.log('\n2. Finding business with ledger data...');
    for (const business of businesses || []) {
        const { data: ledger } = await supabase
            .from('ledger_entries')
            .select('id')
            .eq('business_id', business.id)
            .limit(1);

        if (ledger && ledger.length > 0) {
            targetBusinessId = business.id;
            targetBusinessName = business.name;
            console.log(`   ✅ Found: ${business.name} (${business.id})`);
            break;
        }
    }

    if (!targetBusinessId) {
        console.log('\n❌ No business with ledger data found!');
        return;
    }

    // 3. Create membership
    console.log(`\n3. Creating membership...`);
    console.log(`   User: ${userId}`);
    console.log(`   Business: ${targetBusinessName} (${targetBusinessId})`);
    console.log(`   Role: owner`);

    const { data: newMembership, error } = await supabase
        .from('memberships')
        .insert({
            user_id: userId,
            business_id: targetBusinessId,
            role: 'owner'
        })
        .select()
        .single();

    if (error) {
        console.log('\n❌ Error creating membership:', error.message);
        return;
    }

    console.log('\n✅ SUCCESS! Membership created:');
    console.log(JSON.stringify(newMembership, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEP: Refresh your dashboard!');
    console.log('The dashboard should now show:');
    console.log('  Revenue: ₹21.19');
    console.log('  Net Profit: ₹39.19');
    console.log('='.repeat(80));
}

main().catch(console.error);
