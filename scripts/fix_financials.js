
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- STARTING FINANCIAL FIX (JS MODE) ---');

    // 1. Get All Valid Invoice IDs
    console.log('Fetching Invoices...');
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id');

    if (invError) {
        console.error('Error fetching invoices:', invError);
        process.exit(1);
    }
    const validInvoiceIds = new Set(invoices.map(i => i.id));
    console.log(`Found ${validInvoiceIds.size} valid invoices.`);

    // 2. Fix Transactions
    console.log('Fetching Invoice Transactions...');
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, source_id')
        .eq('source_type', 'invoice');

    if (txError) {
        console.error('Error fetching transactions:', txError);
        process.exit(1);
    }

    const orphanTxIds = transactions
        .filter(t => !validInvoiceIds.has(t.source_id))
        .map(t => t.id);

    console.log(`Found ${orphanTxIds.length} orphaned transactions.`);

    if (orphanTxIds.length > 0) {
        console.log('Deleting orphaned transactions...');
        const { error: delTxError } = await supabase
            .from('transactions')
            .delete()
            .in('id', orphanTxIds);

        if (delTxError) {
            console.error('Error deleting transactions:', delTxError);
            process.exit(1);
        }
        console.log('\u2705 Orphaned transactions deleted.');
    }

    // 3. Fix GST Records
    console.log('Fetching GST Records...');
    const { data: gstRecords, error: gstError } = await supabase
        .from('gst_records')
        .select('id, source_id')
        .eq('source_type', 'invoice');

    if (gstError) {
        console.error('Error fetching GST records:', gstError);
        process.exit(1);
    }

    const orphanGstIds = gstRecords
        .filter(g => !validInvoiceIds.has(g.source_id))
        .map(g => g.id);

    console.log(`Found ${orphanGstIds.length} orphaned GST records.`);

    if (orphanGstIds.length > 0) {
        console.log('Deleting orphaned GST records...');
        const { error: delGstError } = await supabase
            .from('gst_records')
            .delete()
            .in('id', orphanGstIds);

        if (delGstError) {
            console.error('Error deleting GST records:', delGstError);
            process.exit(1);
        }
        console.log('\u2705 Orphaned GST records deleted.');
    }

    console.log('--- FIX COMPLETE ---');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
