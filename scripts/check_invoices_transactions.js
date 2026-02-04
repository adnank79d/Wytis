
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    // Check all invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, subtotal, gst_amount, total_amount')
        .eq('business_id', targetId);

    console.log('=== ALL INVOICES ===');
    invoices.forEach(inv => {
        console.log(`${inv.invoice_number} | ${inv.status.padEnd(10)} | Subtotal: ${inv.subtotal} | Total: ${inv.total_amount}`);
    });

    // Check transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, source_type, source_id, transaction_type, amount, description')
        .eq('business_id', targetId);

    console.log('\n=== ALL TRANSACTIONS ===');
    transactions.forEach(t => {
        console.log(`${t.source_type.padEnd(10)} | ${t.transaction_type.padEnd(10)} | ${t.amount.toString().padStart(10)} | ${t.description || ''}`);
    });
}

main().catch(console.error);
