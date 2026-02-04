
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const businessId = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';

    console.log('INVOICE STATUS CHECK');
    console.log('='.repeat(80));

    // Get all invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_number, status, subtotal, total_amount, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

    console.log(`\nFound ${invoices?.length || 0} invoices:\n`);

    invoices?.forEach(inv => {
        console.log(`Invoice: ${inv.invoice_number}`);
        console.log(`  Status: ${inv.status.toUpperCase()}`);
        console.log(`  Amount: ₹${inv.total_amount}`);
        console.log(`  Created: ${new Date(inv.created_at).toLocaleDateString()}`);
        console.log('');
    });

    // Check ledger for Sales entries
    const { data: salesEntries } = await supabase
        .from('ledger_entries')
        .select('account_name, debit, credit, created_at')
        .eq('business_id', businessId)
        .eq('account_name', 'Sales')
        .order('created_at', { ascending: false });

    console.log(`Sales Ledger Entries: ${salesEntries?.length || 0}\n`);
    salesEntries?.forEach(entry => {
        console.log(`  Credit: ₹${entry.credit}, Debit: ₹${entry.debit}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('EXPLANATION:');
    console.log('='.repeat(80));

    const draftCount = invoices?.filter(i => i.status === 'draft').length || 0;
    const issuedCount = invoices?.filter(i => i.status === 'issued').length || 0;

    if (draftCount > 0 && issuedCount === 0) {
        console.log('\n❌ All invoices are DRAFT status');
        console.log('\nRevenue = ₹0 because:');
        console.log('  1. Draft invoices do NOT create ledger entries');
        console.log('  2. Revenue is ONLY recorded when invoice is ISSUED');
        console.log('  3. Dashboard shows data from ledger_entries (accounting principle)');
        console.log('\n✅ TO FIX:');
        console.log('  1. Go to your invoice');
        console.log('  2. Click "Issue Invoice" button');
        console.log('  3. This will create ledger entries:');
        console.log('     - Dr. Accounts Receivable ₹25');
        console.log('     - Cr. Sales ₹25 (this becomes your Revenue!)');
        console.log('  4. Dashboard will immediately show Revenue = ₹25');
    } else if (issuedCount > 0 && (!salesEntries || salesEntries.length === 0)) {
        console.log('\n❌ CRITICAL: Invoices are issued but NO Sales ledger entries!');
        console.log('This means the invoice issuance trigger is broken.');
    } else if (salesEntries && salesEntries.length > 0) {
        const totalSales = salesEntries.reduce((sum, e) => sum + Number(e.credit) - Number(e.debit), 0);
        console.log(`\n✅ Sales ledger entries exist: ₹${totalSales}`);
        console.log('If dashboard shows ₹0, there might be a view issue.');
    }
}

main().catch(console.error);
