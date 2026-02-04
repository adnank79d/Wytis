
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const userId = '77130221-4bc4-45f3-a0f1-7296eb108794';
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd'; // JS Trading Company

    console.log('FORCE CREATING MEMBERSHIP');
    console.log('='.repeat(80));
    console.log(`User ID: ${userId}`);
    console.log(`Business ID: ${businessId}`);
    console.log(`Role: owner`);
    console.log('');

    // Delete any existing membership first
    console.log('1. Deleting any existing membership...');
    const { error: deleteError } = await supabase
        .from('memberships')
        .delete()
        .eq('user_id', userId);

    if (deleteError) {
        console.log('   Delete error (may be OK if none existed):', deleteError.message);
    } else {
        console.log('   ✅ Deleted existing memberships');
    }

    // Create new membership
    console.log('\n2. Creating new membership...');
    const { data, error } = await supabase
        .from('memberships')
        .insert({
            user_id: userId,
            business_id: businessId,
            role: 'owner'
        })
        .select()
        .single();

    if (error) {
        console.log('   ❌ ERROR:', error.message);
        console.log('   Code:', error.code);
        console.log('   Details:', error.details);
        return;
    }

    console.log('   ✅ SUCCESS!');
    console.log('   Created:', JSON.stringify(data, null, 2));

    // Verify
    console.log('\n3. Verifying...');
    const { data: verify } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId);

    console.log(`   Found ${verify?.length || 0} memberships for this user`);
    verify?.forEach(m => {
        console.log(`     - Business: ${m.business_id}, Role: ${m.role}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ DONE! Now refresh your dashboard.');
    console.log('You should see the financial data appear!');
    console.log('='.repeat(80));
}

main().catch(console.error);
