
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '74a1f63f-9b9c-4ec1-8400-985871f3bdbd';
    console.log(`Checking Business: ${targetId}`);

    // 1. Invoices
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('business_id', targetId)
        .eq('status', 'issued');

    if (invError) return console.error(invError);

    const invoiceTotal = invoices.reduce((sum, i) => sum + i.total_amount, 0);
    console.log(`Issued Invoices Total: ${invoiceTotal}`);

    // 2. Ledger
    const { data: ledger, error: ledError } = await supabase
        .from('ledger_entries')
        .select('debit, credit')
        .eq('business_id', targetId)
        .eq('account_name', 'Accounts Receivable');

    if (ledError) return console.error(ledError);

    const ledgerAR = ledger.reduce((sum, e) => sum + (Number(e.debit) - Number(e.credit)), 0);
    console.log(`Ledger Receivables Balance: ${ledgerAR}`);

    if (Math.abs(invoiceTotal - ledgerAR) > 1) {
        console.log('MISMATCH DETECTED!');
    } else {
        console.log('Data is consistent.');
    }

    // 3. Check for ANY ledger entries to see if P&L is possible
    const { count } = await supabase
        .from('ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', targetId);
    console.log(`Total Ledger Entries: ${count}`);
}

main().catch(console.error);
