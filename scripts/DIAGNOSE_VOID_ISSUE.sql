-- ============================================================================
-- INVOICE VOID DIAGNOSTICS
-- ============================================================================
-- Run this to diagnose why void is failing
-- ============================================================================

-- Check 1: Does the void trigger exist?
SELECT 
  'Trigger Check' as test,
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'public.invoices'::regclass
  AND tgname LIKE '%void%';

-- Check 2: Does the function exist?
SELECT 
  'Function Check' as test,
  proname as function_name,
  pg_get_functiondef(oid) as definition_preview
FROM pg_proc
WHERE proname LIKE '%void%'
  AND pronamespace = 'public'::regnamespace;

-- Check 3: What RLS policies exist on invoices?
SELECT 
  'RLS Policy Check' as test,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY cmd;

-- Check 4: Can we see any issued invoices?
SELECT 
  'Invoice Check' as test,
  id,
  invoice_number,
  status,
  total_amount,
  business_id
FROM invoices
WHERE status = 'issued'
LIMIT 5;

-- Check 5: Try a test void (replace with actual invoice ID)
-- UNCOMMENT AND REPLACE ID:
/*
DO $$
DECLARE
  test_invoice_id uuid;
  result_status text;
BEGIN
  -- Get an issued invoice
  SELECT id INTO test_invoice_id
  FROM invoices
  WHERE status = 'issued'
  LIMIT 1;
  
  IF test_invoice_id IS NULL THEN
    RAISE NOTICE 'No issued invoices found to test';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing void on invoice: %', test_invoice_id;
  
  -- Try to void it
  UPDATE invoices
  SET status = 'cancelled'
  WHERE id = test_invoice_id;
  
  -- Check result
  SELECT status INTO result_status
  FROM invoices
  WHERE id = test_invoice_id;
  
  RAISE NOTICE 'Result status: %', result_status;
  
  -- Check if reversal was created
  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE source_id = test_invoice_id
      AND description LIKE 'REVERSAL:%'
  ) THEN
    RAISE NOTICE '✅ Reversal transaction created';
  ELSE
    RAISE WARNING '❌ No reversal transaction found';
  END IF;
  
  -- Rollback the test
  RAISE EXCEPTION 'Rolling back test void';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test completed (rolled back)';
END $$;
*/

-- Check 6: Look for recent errors in logs
-- (This won't show in SQL editor, but useful for debugging)
SELECT 
  'Recent Transactions' as test,
  t.id,
  t.description,
  t.transaction_date,
  COUNT(l.id) as ledger_entry_count
FROM transactions t
LEFT JOIN ledger_entries l ON l.transaction_id = t.id
WHERE t.source_type = 'invoice'
GROUP BY t.id, t.description, t.transaction_date
ORDER BY t.transaction_date DESC
LIMIT 10;

-- ============================================================================
-- COMMON ISSUES AND FIXES
-- ============================================================================

-- ISSUE 1: Trigger doesn't exist
-- FIX: Run the migration 20260131000002_invoice_void_fix.sql

-- ISSUE 2: RLS blocking update
-- FIX: Check if user has membership in the business

-- ISSUE 3: Invoice not in 'issued' status
-- FIX: Only issued invoices can be voided

-- ISSUE 4: Function has errors
-- FIX: Check function definition above

-- ============================================================================
-- MANUAL VOID TEST (Safe - uses transaction)
-- ============================================================================

-- Replace 'YOUR-INVOICE-NUMBER' with actual invoice number
/*
BEGIN;

-- Void the invoice
UPDATE invoices
SET status = 'cancelled'
WHERE invoice_number = 'YOUR-INVOICE-NUMBER'
  AND status = 'issued';

-- Check what happened
SELECT 
  t.description,
  l.account_name,
  l.debit,
  l.credit
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
WHERE t.source_id = (SELECT id FROM invoices WHERE invoice_number = 'YOUR-INVOICE-NUMBER')
ORDER BY t.transaction_date, l.account_name;

-- If it looks good, COMMIT. Otherwise, ROLLBACK.
ROLLBACK; -- Change to COMMIT when ready
*/
