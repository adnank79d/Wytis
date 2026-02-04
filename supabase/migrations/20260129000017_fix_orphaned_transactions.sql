-- Migration: 20260129000017_fix_orphaned_transactions
-- Description: Cleans up orphaned transactions/gst_records linked to deleted invoices and adds a trigger to prevent recurrence.

-- 1. CLEANUP ORPHANED GST RECORDS
-- Delete GST records where the source invoice no longer exists
DELETE FROM public.gst_records
WHERE source_type = 'invoice' 
  AND source_id NOT IN (SELECT id FROM public.invoices);

-- 2. CLEANUP ORPHANED TRANSACTIONS
-- Delete transactions where the source invoice no longer exists
-- Note: 'ledger_entries' are linked to 'transactions' via FK with CASCADE, so they will be auto-deleted.
DELETE FROM public.transactions
WHERE source_type = 'invoice' 
  AND source_id NOT IN (SELECT id FROM public.invoices);

-- 3. CREATE TRIGGER FOR FUTURE DELETIONS
-- Since transactions represents the "financial reality", removing an invoice should technically reverse it (void), 
-- but if we are Hard Deleting an invoice, we imply it never existed, so we Hard Delete the transaction too.

CREATE OR REPLACE FUNCTION public.handle_invoice_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete associated transactions (which cascades to ledger_entries)
  DELETE FROM public.transactions
  WHERE business_id = OLD.business_id
    AND source_type = 'invoice'
    AND source_id = OLD.id;

  -- Delete associated GST records
  DELETE FROM public.gst_records
  WHERE business_id = OLD.business_id
    AND source_type = 'invoice'
    AND source_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_delete_cleanup ON public.invoices;
CREATE TRIGGER on_invoice_delete_cleanup
  AFTER DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_deletion();
