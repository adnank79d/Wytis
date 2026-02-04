
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('CHECKING GST_RECORDS TABLE SCHEMA');
    console.log('='.repeat(80));

    // Get a sample record to see the structure
    const { data: sample, error } = await supabase
        .from('gst_records')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    if (!sample) {
        console.log('No gst_records found in database');
        return;
    }

    console.log('\nSample GST Record:');
    console.log(JSON.stringify(sample, null, 2));

    console.log('\nColumn Names:');
    Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[key]}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');

    if (sample.invoice_id) {
        console.log('✅ Has invoice_id column');
    } else if (sample.source_id) {
        console.log('✅ Has source_id column (polymorphic)');
        console.log('   Use: source_id + source_type for deletion');
    } else {
        console.log('❌ No clear foreign key to invoices!');
        console.log('   Available columns:', Object.keys(sample).join(', '));
    }
}

main().catch(console.error);
