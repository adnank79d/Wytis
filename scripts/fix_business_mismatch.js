
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('FIXING BUSINESS ID MISMATCH');
    console.log('='.repeat(80));

    // 1. Find the user's business (from membership)
    const { data: memberships } = await supabase
        .from('memberships')
        .select('user_id, business_id, businesses(name)')
        .limit(1)
        .single();

    if (!memberships) {
        console.log('❌ No membership found!');
        return;
    }

    const userBusinessId = memberships.business_id;
    const userBusinessName = memberships.businesses?.name;

    console.log(`\n1. USER'S BUSINESS:`);
    console.log(`   ID: ${userBusinessId}`);
    console.log(`   Name: ${userBusinessName}`);

    // 2. Find which business has ledger data
    const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name');

    let dataBusinessId = null;
    let dataBusinessName = null;

    console.log(`\n2. CHECKING LEDGER DATA:`);
    for (const business of businesses || []) {
        const { data: ledger, count } = await supabase
            .from('ledger_entries')
            .select('id', { count: 'exact', head: false })
            .eq('business_id', business.id);

        if (ledger && ledger.length > 0) {
            console.log(`   ✅ ${business.name}: ${ledger.length} ledger entries`);
            dataBusinessId = business.id;
            dataBusinessName = business.name;
        } else {
            console.log(`   ❌ ${business.name}: 0 ledger entries`);
        }
    }

    if (!dataBusinessId) {
        console.log('\n❌ NO LEDGER DATA FOUND IN ANY BUSINESS!');
        return;
    }

    // 3. Check if they match
    console.log(`\n3. COMPARISON:`);
    console.log(`   User's Business: ${userBusinessName} (${userBusinessId})`);
    console.log(`   Data in Business: ${dataBusinessName} (${dataBusinessId})`);

    if (userBusinessId === dataBusinessId) {
        console.log('\n✅ THEY MATCH! No fix needed.');
        console.log('The issue must be something else.');
        return;
    }

    console.log('\n❌ MISMATCH FOUND!');
    console.log(`\nFIX OPTION 1: Move ledger data to user's business`);
    console.log(`   Update all ledger_entries from ${dataBusinessName} to ${userBusinessName}`);

    console.log(`\nFIX OPTION 2: Update user's membership`);
    console.log(`   Change membership to point to ${dataBusinessName}`);

    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDED FIX: Move ledger data to user\'s business');
    console.log('='.repeat(80));

    // Ask for confirmation (in a real scenario)
    console.log('\nWould you like to proceed with moving the data? (y/n)');
    console.log('This will update:');
    console.log('- ledger_entries');
    console.log('- transactions');
    console.log('- gst_records');
    console.log('- invoices');
    console.log(`From business: ${dataBusinessName}`);
    console.log(`To business: ${userBusinessName}`);

    // For now, just show what would be updated
    const { data: ledgerCount } = await supabase
        .from('ledger_entries')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', dataBusinessId);

    const { data: invoiceCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', dataBusinessId);

    const { data: txnCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', dataBusinessId);

    console.log('\nRecords to update:');
    console.log(`  Ledger Entries: ${ledgerCount?.length || 0}`);
    console.log(`  Invoices: ${invoiceCount?.length || 0}`);
    console.log(`  Transactions: ${txnCount?.length || 0}`);
}

main().catch(console.error);
