
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== FINAL COMPREHENSIVE CLEANUP ===\n');

    // Get ALL businesses to clean up globally
    const { data: businesses } = await supabase.from('businesses').select('id, name');

    for (const business of businesses) {
        console.log(`\nCleaning: ${business.name} (${business.id.substring(0, 8)}...)`);

        // Get all invoice transactions
        const { data: txns } = await supabase
            .from('transactions')
            .select('id, source_id')
            .eq('business_id', business.id)
            .eq('source_type', 'invoice');

        // Get all valid invoices
        const { data: invoices } = await supabase
            .from('invoices')
            .select('id')
            .eq('business_id', business.id);

        const validIds = new Set(invoices.map(i => i.id));
        const orphanedTxns = txns.filter(t => !validIds.has(t.source_id));

        if (orphanedTxns.length > 0) {
            console.log(`  Found ${orphanedTxns.length} orphaned transactions`);

            const orphanedIds = orphanedTxns.map(t => t.id);

            // Delete in correct order: ledger -> gst -> transactions
            const { data: delLedger } = await supabase
                .from('ledger_entries')
                .delete()
                .in('transaction_id', orphanedIds)
                .select();
            console.log(`  ✅ Deleted ${delLedger?.length || 0} ledger entries`);

            const { data: delGST } = await supabase
                .from('gst_records')
                .delete()
                .in('transaction_id', orphanedIds)
                .select();
            console.log(`  ✅ Deleted ${delGST?.length || 0} GST records`);

            const { data: delTxns } = await supabase
                .from('transactions')
                .delete()
                .in('id', orphanedIds)
                .select();
            console.log(`  ✅ Deleted ${delTxns?.length || 0} transactions`);
        } else {
            console.log(`  ✅ No orphaned data`);
        }
    }

    console.log(`\n\n=== CLEANUP COMPLETE ===`);
    console.log(`Please refresh your dashboard to see corrected metrics.`);
}

main().catch(console.error);
