
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    // Get all invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, subtotal, gst_amount, total_amount')
        .eq('business_id', targetId)
        .order('created_at', { ascending: true });

    console.log('=== ALL INVOICES ===\n');
    invoices.forEach(inv => {
        console.log(`${inv.invoice_number} | ${inv.status.padEnd(10)} | Subtotal: ${inv.subtotal.toString().padStart(8)} | Total: ${inv.total_amount.toString().padStart(8)}`);
    });

    // Get all transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('source_id, transaction_type, amount, description')
        .eq('business_id', targetId)
        .eq('source_type', 'invoice')
        .order('created_at', { ascending: true });

    console.log('\n=== ALL INVOICE TRANSACTIONS ===\n');
    transactions.forEach(t => {
        const inv = invoices.find(i => i.id === t.source_id);
        console.log(`${inv?.invoice_number || 'UNKNOWN'} | ${t.transaction_type.padEnd(10)} | ${t.amount.toString().padStart(8)} | ${t.description || ''}`);
    });

    // Summary
    const issuedInvoices = invoices.filter(i => i.status === 'issued');
    const voidedInvoices = invoices.filter(i => i.status === 'void');
    const draftInvoices = invoices.filter(i => i.status === 'draft');

    console.log('\n=== SUMMARY ===');
    console.log(`Issued: ${issuedInvoices.length} (Subtotal: ${issuedInvoices.reduce((s, i) => s + i.subtotal, 0)})`);
    console.log(`Voided: ${voidedInvoices.length} (Subtotal: ${voidedInvoices.reduce((s, i) => s + i.subtotal, 0)})`);
    console.log(`Draft: ${draftInvoices.length}`);
}

main().catch(console.error);
