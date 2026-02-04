
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('CHECKING EXISTING SOURCE_TYPES');
    console.log('='.repeat(80));

    // Get all unique source_types
    const { data, error } = await supabase
        .from('transactions')
        .select('source_type');

    if (error) {
        console.error('Error fetching transactions:', error);
        return;
    }

    const types = {};
    data.forEach(row => {
        types[row.source_type] = (types[row.source_type] || 0) + 1;
    });

    console.log('Found the following source_types in the database:');
    console.log(JSON.stringify(types, null, 2));

    console.log('\nAllowed types in new constraint:');
    console.log("['invoice', 'expense', 'payment', 'journal', 'salary', 'refund']");

    console.log('\n' + '='.repeat(80));
    console.log('ACTION PLAN:');
    console.log('Any type NOT in the allowed list is causing the error.');
    console.log('We need to update those rows to a valid type.');
}

main().catch(console.error);
