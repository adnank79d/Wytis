
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    const { data: sales } = await supabase
        .from('ledger_entries')
        .select('debit, credit')
        .eq('business_id', targetId)
        .eq('account_name', 'Sales');

    const totalDr = sales.reduce((s, e) => s + Number(e.debit), 0);
    const totalCr = sales.reduce((s, e) => s + Number(e.credit), 0);

    console.log(`Sales Debits (voids/returns): ${totalDr}`);
    console.log(`Sales Credits (actual sales): ${totalCr}`);
    console.log(`Net Sales (Cr - Dr): ${totalCr - totalDr}`);

    // Check if there are actual issued invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('subtotal, status')
        .eq('business_id', targetId)
        .eq('status', 'issued');

    const invoiceTotal = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
    console.log(`\nIssued Invoice Subtotals: ${invoiceTotal}`);
    console.log(`\nDISCREPANCY: ${Math.abs(invoiceTotal - (totalCr - totalDr))}`);
}

main().catch(console.error);
