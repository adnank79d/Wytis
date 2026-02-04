
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('DIAGNOSING INVOICE DELETION ISSUE');
    console.log('='.repeat(80));

    // Get all invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('business_id', businessId);

    console.log(`\nFound ${invoices?.length || 0} invoices\n`);

    if (!invoices || invoices.length === 0) {
        console.log('No invoices to check');
        return;
    }

    // For each invoice, check associated records
    for (const invoice of invoices) {
        console.log(`Invoice: ${invoice.invoice_number} (${invoice.status})`);

        // Check transactions
        const { data: txns } = await supabase
            .from('transactions')
            .select('id, source_type, description, amount')
            .eq('source_id', invoice.id);

        console.log(`  Transactions: ${txns?.length || 0}`);
        txns?.forEach(t => {
            console.log(`    - ${t.source_type}: ₹${t.amount} (${t.description || 'no desc'})`);
        });

        // Check ledger entries
        if (txns && txns.length > 0) {
            const txnIds = txns.map(t => t.id);
            const { data: ledger } = await supabase
                .from('ledger_entries')
                .select('account_name, debit, credit')
                .in('transaction_id', txnIds);

            console.log(`  Ledger Entries: ${ledger?.length || 0}`);
            ledger?.forEach(e => {
                console.log(`    - ${e.account_name}: Dr ₹${e.debit}, Cr ₹${e.credit}`);
            });
        }

        // Check GST records
        const { data: gst } = await supabase
            .from('gst_records')
            .select('gst_type, amount')
            .eq('source_id', invoice.id)
            .eq('source_type', 'invoice');

        console.log(`  GST Records: ${gst?.length || 0}`);

        console.log('');
    }

    console.log('='.repeat(80));
    console.log('DELETION TRIGGER CHECK:');
    console.log('='.repeat(80));

    // Check if trigger exists
    console.log('\nTo verify trigger exists, run this in Supabase SQL Editor:');
    console.log(`
SELECT 
  tgname, 
  tgenabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'invoices'::regclass
  AND tgname = 'trigger_cleanup_invoice_financials';
  `);

    console.log('\n' + '='.repeat(80));
    console.log('SOLUTION:');
    console.log('='.repeat(80));
    console.log('\n1. Apply the corrected SQL: scripts/APPLY_ACCOUNTING_FIXES_CORRECTED.sql');
    console.log('2. This will recreate the deletion trigger with proper cleanup');
    console.log('3. Test by deleting an invoice and checking dashboard');
}

main().catch(console.error);
