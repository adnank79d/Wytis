-- check_orphans.sql
-- Check for transactions that point to non-existent sources

SELECT 
    source_type, 
    COUNT(*) as orphan_count,
    SUM(amount) as orphan_value
FROM public.transactions
WHERE 
    (source_type = 'invoice' AND source_id NOT IN (SELECT id FROM public.invoices))
    OR
    (source_type = 'expense' AND source_id NOT IN (SELECT id FROM public.expenses))
    OR
    (source_type = 'void' AND source_id NOT IN (SELECT id FROM public.invoices)) -- Void transactions link to invoices too
GROUP BY source_type;
