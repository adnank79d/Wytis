
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const targetId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('=== ADDING MISSING COGS ENTRIES ===\n');

    // Get all issued/paid invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select(`
      id,
      invoice_number,
      status,
      subtotal,
      invoice_items (
        quantity,
        cost_price
      )
    `)
        .eq('business_id', targetId)
        .in('status', ['issued', 'paid']);

    console.log(`Found ${invoices.length} invoices to process\n`);

    for (const invoice of invoices) {
        console.log(`Processing ${invoice.invoice_number}...`);

        // Calculate COGS
        const totalCOGS = invoice.invoice_items.reduce((sum, item) => {
            return sum + (item.quantity * (item.cost_price || 0));
        }, 0);

        console.log(`  COGS: ₹${totalCOGS.toFixed(2)}`);

        if (totalCOGS === 0) {
            console.log(`  ⚠️  No COGS (cost_price is 0) - skipping`);
            continue;
        }

        // Check if COGS entry already exists
        const { data: existingCOGS } = await supabase
            .from('ledger_entries')
            .select('id')
            .eq('business_id', targetId)
            .eq('account_name', 'Cost of Goods Sold')
            .eq('debit', totalCOGS);

        if (existingCOGS && existingCOGS.length > 0) {
            console.log(`  ✅ COGS entry already exists - skipping`);
            continue;
        }

        // Get the transaction for this invoice
        const { data: transaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('business_id', targetId)
            .eq('source_type', 'invoice')
            .eq('source_id', invoice.id)
            .single();

        if (!transaction) {
            console.log(`  ❌ No transaction found - skipping`);
            continue;
        }

        // Add COGS ledger entries
        const ledgerEntries = [
            {
                business_id: targetId,
                transaction_id: transaction.id,
                account_name: 'Cost of Goods Sold',
                debit: totalCOGS,
                credit: 0
            },
            {
                business_id: targetId,
                transaction_id: transaction.id,
                account_name: 'Inventory',
                debit: 0,
                credit: totalCOGS
            }
        ];

        const { error } = await supabase
            .from('ledger_entries')
            .insert(ledgerEntries);

        if (error) {
            console.log(`  ❌ Error: ${error.message}`);
        } else {
            console.log(`  ✅ Added COGS entries`);
        }
    }

    console.log('\n=== VERIFICATION ===\n');

    // Check new balances
    const { data: ledger } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit')
        .eq('business_id', targetId);

    const balances = {};
    ledger.forEach(e => {
        const amount = Number(e.credit) - Number(e.debit);
        balances[e.account_name] = (balances[e.account_name] || 0) + amount;
    });

    console.log('Updated Account Balances:');
    Object.entries(balances).forEach(([acc, val]) => {
        if (Math.abs(val) > 0.01) {
            console.log(`  ${acc}: ₹${val.toFixed(2)}`);
        }
    });

    const sales = balances['Sales'] || 0;
    const cogs = balances['Cost of Goods Sold'] || 0;
    const netProfit = sales + cogs; // COGS is negative

    console.log(`\nExpected Dashboard Values:`);
    console.log(`  Revenue: ₹${sales.toFixed(2)}`);
    console.log(`  Net Profit: ₹${netProfit.toFixed(2)}`);
    console.log(`\n✅ DONE! Refresh your dashboard to see the corrected values.`);
}

main().catch(console.error);
