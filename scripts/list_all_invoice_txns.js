
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    const { data: txns } = await supabase
        .from('transactions')
        .select('id, source_id, transaction_type, amount, description')
        .eq('business_id', targetId)
        .eq('source_type', 'invoice')
        .order('created_at', { ascending: true });

    console.log('ALL INVOICE TRANSACTIONS:\n');
    txns.forEach((t, i) => {
        console.log(`${i + 1}. ${t.transaction_type.padEnd(10)} | Amt: ${t.amount.toString().padStart(8)} | ${t.description || 'N/A'}`);
        console.log(`   Source ID: ${t.source_id}`);
        console.log(`   Txn ID: ${t.id.substring(0, 12)}...`);
        console.log('');
    });

    // Check which invoices exist
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('business_id', targetId);

    console.log('EXISTING INVOICES:\n');
    invoices.forEach(inv => {
        console.log(`${inv.invoice_number} (${inv.status}) - ID: ${inv.id}`);
    });

    // Cross-check
    const invoiceIds = new Set(invoices.map(i => i.id));
    const orphaned = txns.filter(t => !invoiceIds.has(t.source_id));

    console.log(`\n\nORPHANED: ${orphaned.length} transactions`);
    orphaned.forEach(t => {
        console.log(`  - ${t.transaction_type} | ${t.amount} | ${t.description}`);
    });
}

main().catch(console.error);
