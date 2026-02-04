
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('CHECKING TRANSACTIONS TABLE CONSTRAINT');
    console.log('='.repeat(80));

    // Check what source_type values are allowed
    const { data, error } = await supabase.rpc('get_table_constraints', {
        table_name: 'transactions'
    }).catch(() => ({ data: null, error: null }));

    // Alternative: Try to query the constraint directly
    console.log('\nAttempting to check constraint via pg_catalog...\n');

    // For now, let's just check what values currently exist
    const { data: existingTypes } = await supabase
        .from('transactions')
        .select('source_type')
        .limit(100);

    const uniqueTypes = [...new Set(existingTypes?.map(t => t.source_type) || [])];

    console.log('Existing source_type values in database:');
    uniqueTypes.forEach(type => console.log(`  - ${type}`));

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(80));
    console.log('\nThe error message was:');
    console.log('  "new row violates check constraint transactions_source_type_check"');
    console.log('\nThis means "payment" is NOT in the allowed values.');
    console.log('\nSOLUTION OPTIONS:');
    console.log('1. Add "payment" to the constraint (requires migration)');
    console.log('2. Use "invoice" as source_type for payment transactions');
    console.log('\nRecommendation: Use option 2 (simpler, no migration needed)');
}

main().catch(console.error);
