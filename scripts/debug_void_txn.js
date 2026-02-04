
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    // Get the void transaction's source_id
    const { data: voidTxn } = await supabase
        .from('transactions')
        .select('id, source_id, description, amount')
        .eq('business_id', targetId)
        .eq('source_type', 'invoice')
        .eq('transaction_type', 'debit')
        .ilike('description', '%VOID%')
        .single();

    if (!voidTxn) {
        console.log('No void transaction found');
        return;
    }

    console.log('VOID TRANSACTION:');
    console.log(`  ID: ${voidTxn.id}`);
    console.log(`  Source ID: ${voidTxn.source_id}`);
    console.log(`  Amount: ${voidTxn.amount}`);
    console.log(`  Description: ${voidTxn.description}`);

    // Check if invoice exists
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('id', voidTxn.source_id)
        .maybeSingle();

    console.log('\nINVOICE CHECK:');
    if (invoice) {
        console.log(`  ✅ Invoice EXISTS: ${invoice.invoice_number} (${invoice.status})`);
    } else {
        console.log(`  ❌ Invoice DOES NOT EXIST`);
        console.log(`  This is an ORPHANED transaction!`);
    }
}

main().catch(console.error);
