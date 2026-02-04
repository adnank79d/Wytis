
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const userId = '77130221-4bc4-45f3-a0f1-7296eb108794';

    console.log('MEMBERSHIP INVESTIGATION');
    console.log('='.repeat(80));

    // 1. Check with service role (bypasses RLS)
    console.log('\n1. Checking with SERVICE ROLE (bypasses RLS):');
    const { data: serviceRoleMemberships, error: serviceError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId);

    if (serviceError) {
        console.log('   Error:', serviceError.message);
    } else {
        console.log(`   Found: ${serviceRoleMemberships?.length || 0} memberships`);
        serviceRoleMemberships?.forEach(m => {
            console.log(`     - Business: ${m.business_id}, Role: ${m.role}`);
        });
    }

    // 2. Check ALL memberships
    console.log('\n2. ALL MEMBERSHIPS IN DATABASE:');
    const { data: allMemberships } = await supabase
        .from('memberships')
        .select('user_id, business_id, role');

    console.log(`   Total: ${allMemberships?.length || 0}`);
    allMemberships?.forEach(m => {
        const isTargetUser = m.user_id === userId;
        console.log(`   ${isTargetUser ? '👉' : '  '} User: ${m.user_id.substring(0, 8)}... → Business: ${m.business_id.substring(0, 8)}... (${m.role})`);
    });

    // 3. Try the EXACT query that dashboard.ts uses
    console.log('\n3. SIMULATING DASHBOARD.TS QUERY:');
    console.log('   Query: .select("business_id, role").eq("user_id", userId).single()');

    const { data: dashboardQuery, error: dashError } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', userId)
        .single();

    if (dashError) {
        console.log('   ❌ Error:', dashError.message);
        console.log('   Code:', dashError.code);
    } else if (!dashboardQuery) {
        console.log('   ❌ Returned NULL');
    } else {
        console.log('   ✅ Success:', dashboardQuery);
    }

    // 4. Check RLS policies
    console.log('\n4. CHECKING RLS POLICIES:');
    const { data: policies } = await supabase
        .rpc('pg_policies')
        .eq('tablename', 'memberships');

    if (policies) {
        console.log(`   Found ${policies.length} policies`);
    } else {
        console.log('   Could not fetch policies (expected - need custom query)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');

    if (serviceRoleMemberships && serviceRoleMemberships.length > 0) {
        console.log('✅ Membership EXISTS in database');
        if (dashError || !dashboardQuery) {
            console.log('❌ But dashboard.ts query FAILS');
            console.log('\nPossible causes:');
            console.log('1. RLS policy is blocking the query');
            console.log('2. The query uses wrong syntax');
            console.log('3. Supabase client in dashboard.ts is not authenticated');
            console.log('\nRECOMMENDED FIX:');
            console.log('Check if createClient() in dashboard.ts is using the correct auth context');
        } else {
            console.log('✅ Dashboard query works!');
            console.log('The issue must be with the auth context in the actual request');
        }
    } else {
        console.log('❌ Membership does NOT exist');
        console.log('Need to create it');
    }
}

main().catch(console.error);
