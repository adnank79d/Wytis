
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- STARTING FINANCIAL FIX (FINAL MODE) ---');

    // 1. Get All Valid Invoice IDs
    console.log('Fetching Invoices...');
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id');

    if (invError) throw invError;
    const validInvoiceIds = new Set(invoices.map(i => i.id));
    console.log(`Found ${validInvoiceIds.size} valid invoices.`);

    // 2. Fix Transactions
    console.log('Fetching Invoice Transactions...');
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, source_id')
        .eq('source_type', 'invoice');

    if (txError) throw txError;

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

        if (delTxError) throw delTxError;
        console.log('\u2705 Orphaned transactions deleted.');
    }

    // 3. Fix GST Records
    console.log('Fetching GST Records...');
    const { data: gstRecords, error: gstError } = await supabase
        .from('gst_records')
        .select('id, source_id')
        .eq('source_type', 'invoice');

    if (gstError) throw gstError;

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

        if (delGstError) throw delGstError;
        console.log('\u2705 Orphaned GST records deleted.');
    }

    console.log('--- FIX COMPLETE ---');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
