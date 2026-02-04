-- Automatic Cleanup Triggers for Invoice Deletion
-- This ensures that when an invoice is deleted, all related financial records are automatically cleaned up
-- preventing orphaned transactions, ledger entries, and GST records

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
-- Using BEFORE ensures cleanup happens before the invoice is removed
DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
CREATE TRIGGER trigger_cleanup_invoice_financials
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_invoice_financial_records();

-- Add comment for documentation
COMMENT ON FUNCTION public.cleanup_invoice_financial_records() IS 
'Automatically cleans up all financial records (transactions, ledger entries, GST records) when an invoice is deleted';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
