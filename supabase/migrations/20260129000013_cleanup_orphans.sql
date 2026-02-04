-- Cleanup Orphaned Local Transactions
-- Deletes transactions and gst_records that point to missing invoices/expenses

BEGIN;

-- 1. Delete orphaned invoice transactions (and void transactions for invoices)
DELETE FROM public.transactions
WHERE 
  (source_type = 'invoice' AND source_id NOT IN (SELECT id FROM public.invoices))
  OR
  (source_type = 'void' AND source_id NOT IN (SELECT id FROM public.invoices));

-- 2. Delete orphaned expense transactions
DELETE FROM public.transactions
WHERE 
  source_type = 'expense' AND source_id NOT IN (SELECT id FROM public.expenses);

-- 3. Delete orphaned GST records
DELETE FROM public.gst_records
WHERE 
  (source_type = 'invoice' AND source_id NOT IN (SELECT id FROM public.invoices));

COMMIT;

-- Reload Schema (Good practice after data cleanup impacting views usually not needed but harmless)
NOTIFY pgrst, 'reload schema';
