-- ============================================================================
-- AUTOMATIC INVOICE DELETION CLEANUP TRIGGER
-- ============================================================================
-- Copy and paste this entire script into your Supabase SQL Editor and run it
-- This will enable real-time data updates when you delete invoices
-- ============================================================================

-- Step 1: Create the cleanup function
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

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
CREATE TRIGGER trigger_cleanup_invoice_financials
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_invoice_financial_records();

-- Step 3: Add documentation
COMMENT ON FUNCTION public.cleanup_invoice_financial_records() IS 
'Automatically cleans up all financial records (transactions, ledger entries, GST records) when an invoice is deleted. This ensures dashboard data stays accurate in real-time.';

-- ============================================================================
-- DONE! You should see "Success. No rows returned" message
-- ============================================================================
