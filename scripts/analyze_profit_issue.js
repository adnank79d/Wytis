
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== ANALYZING REVENUE vs PROFIT DISCREPANCY ===\n');

    // Check invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, subtotal, gst_amount, total_amount')
        .eq('business_id', targetId);

    console.log(`Invoices: ${invoices.length}`);
    invoices.forEach(inv => {
        console.log(`  ${inv.invoice_number} (${inv.status})`);
        console.log(`    Subtotal: ₹${inv.subtotal}`);
        console.log(`    GST: ₹${inv.gst_amount}`);
        console.log(`    Total: ₹${inv.total_amount}`);
    });

    // Check invoice items to see cost_price
    if (invoices.length > 0) {
        const { data: items } = await supabase
            .from('invoice_items')
            .select('*')
            .in('invoice_id', invoices.map(i => i.id));

        console.log(`\nInvoice Items: ${items.length}`);
        items.forEach(item => {
            console.log(`  Qty: ${item.quantity} | Price: ₹${item.unit_price} | Cost: ₹${item.cost_price || 0} | GST: ${item.gst_rate}%`);
            const revenue = item.quantity * item.unit_price;
            const cost = item.quantity * (item.cost_price || 0);
            const profit = revenue - cost;
            console.log(`    Revenue: ₹${revenue} | Cost: ₹${cost} | Profit: ₹${profit}`);
        });
    }

    // Check ledger entries
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    console.log(`\nLedger Entries: ${ledger.length}`);

    const balances = {};
    ledger.forEach(e => {
        const amount = Number(e.credit) - Number(e.debit);
        balances[e.account_name] = (balances[e.account_name] || 0) + amount;
    });

    console.log('\nAccount Balances:');
    Object.entries(balances).forEach(([acc, val]) => {
        if (Math.abs(val) > 0.01) {
            console.log(`  ${acc}: ₹${val.toFixed(2)}`);
        }
    });

    // Calculate expected values
    const sales = balances['Sales'] || 0;
    const cogs = balances['Cost of Goods Sold'] || 0;
    const expenses = Object.entries(balances)
        .filter(([acc]) => !['Sales', 'Other Income', 'Accounts Receivable', 'Bank', 'Cash', 'GST Payable', 'Capital', 'Retained Earnings'].includes(acc))
        .reduce((sum, [_, val]) => sum + val, 0);

    console.log('\n=== EXPECTED CALCULATIONS ===');
    console.log(`Sales (Revenue): ₹${sales.toFixed(2)}`);
    console.log(`COGS: ₹${cogs.toFixed(2)}`);
    console.log(`Other Expenses: ₹${expenses.toFixed(2)}`);
    console.log(`Expected Net Profit: ₹${(sales + cogs + expenses).toFixed(2)}`);
    console.log('\nNote: COGS and Expenses should be negative');
}

main().catch(console.error);
