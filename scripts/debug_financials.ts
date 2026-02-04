
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env specific to the project
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- STARTING FINANCIAL HEALTH CHECK ---');

    // 1. Check for Transactions with missing Invoices
    console.log('\nChecking for Orphaned Transactions (source_type = invoice)...');
    const { data: invoiceTrx, error: trxError } = await supabase
        .from('transactions')
        .select('id, source_id, amount, description, created_at')
        .eq('source_type', 'invoice');

    if (trxError) throw trxError;

    const { data: allInvoices, error: invError } = await supabase
        .from('invoices')
        .select('id');

    if (invError) throw invError;

    const validInvoiceIds = new Set(allInvoices.map(i => i.id));
    const orphans = invoiceTrx.filter(t => !validInvoiceIds.has(t.source_id));

    if (orphans.length > 0) {
        console.error(`\u274C FOUND ${orphans.length} ORPHANED TRANSACTIONS!`);
        orphans.forEach(o => {
            console.log(`   - TrxID: ${o.id} | InvID: ${o.source_id} | Amount: ${o.amount} | Date: ${o.created_at}`);
        });
    } else {
        console.log('\u2705 No orphaned invoice transactions found.');
    }

    // 2. Check for Orphaned GST Records
    console.log('\nChecking for Orphaned GST Records...');
    const { data: gstRecords, error: gstError } = await supabase
        .from('gst_records')
        .select('id, source_id, amount')
        .eq('source_type', 'invoice');

    if (gstError) throw gstError;

    const gstOrphans = gstRecords.filter(g => !validInvoiceIds.has(g.source_id));

    if (gstOrphans.length > 0) {
        console.error(`\u274C FOUND ${gstOrphans.length} ORPHANED GST RECORDS!`);
        gstOrphans.forEach(o => {
            console.log(`   - GST ID: ${o.id} | InvID: ${o.source_id} | Amount: ${o.amount}`);
        });
    } else {
        console.log('\u2705 No orphaned GST records found.');
    }

    // 3. Check Ledger Consistency (Optional deep dive)
    console.log('\nChecking Ledger Sums...');
    const { data: ledger, error: ledError } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit');

    if (ledError) throw ledError;

    const totals: Record<string, { db: number, cr: number }> = {};
    ledger.forEach(l => {
        if (!totals[l.account_name]) totals[l.account_name] = { db: 0, cr: 0 };
        totals[l.account_name].db += Number(l.debit);
        totals[l.account_name].cr += Number(l.credit);
    });

    console.table(totals);
}

main().catch(console.error);
