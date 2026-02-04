
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ropeqwybizgtodkrabbp.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== APPLYING AUTOMATIC CLEANUP TRIGGER ===\n');

    // SQL to create the function and trigger
    const sql = `
    -- Function to clean up all financial records related to a deleted invoice
    CREATE OR REPLACE FUNCTION public.cleanup_invoice_financial_records()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Delete GST records associated with transactions for this invoice
      DELETE FROM public.gst_records
      WHERE transaction_id IN (
        SELECT id FROM public.transactions
        WHERE source_type = 'invoice' AND source_id = OLD.id
      );

      -- Delete ledger entries associated with transactions for this invoice
      DELETE FROM public.ledger_entries
      WHERE transaction_id IN (
        SELECT id FROM public.transactions
        WHERE source_type = 'invoice' AND source_id = OLD.id
      );

      -- Delete transactions for this invoice
      DELETE FROM public.transactions
      WHERE source_type = 'invoice' AND source_id = OLD.id;

      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger that fires BEFORE invoice deletion
    DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
    CREATE TRIGGER trigger_cleanup_invoice_financials
      BEFORE DELETE ON public.invoices
      FOR EACH ROW
      EXECUTE FUNCTION public.cleanup_invoice_financial_records();
  `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error applying trigger:', error);
            console.log('\nTrying alternative method...\n');

            // Alternative: Apply via direct SQL execution
            // This requires the postgres extension or direct database access
            console.log('Please run the following SQL in your Supabase SQL Editor:');
            console.log('='.repeat(80));
            console.log(sql);
            console.log('='.repeat(80));
        } else {
            console.log('✅ Automatic cleanup trigger applied successfully!');
            console.log('\nNow when you delete an invoice, all related records will be automatically cleaned up:');
            console.log('  - Transactions');
            console.log('  - Ledger entries');
            console.log('  - GST records');
            console.log('\nYour dashboard will update in real-time! 🎉');
        }
    } catch (err) {
        console.error('Error:', err);
        console.log('\nPlease apply the trigger manually using the SQL below:');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
    }
}

main().catch(console.error);
