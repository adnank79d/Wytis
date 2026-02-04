-- ============================================================================
-- QUICK VOID DIAGNOSTIC - Run this to find the exact error
-- ============================================================================

-- Step 1: Check if the void trigger exists
SELECT 
  'Trigger Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'invoice_void_trigger' 
        AND tgrelid = 'public.invoices'::regclass
    ) THEN '✅ Trigger EXISTS'
    ELSE '❌ Trigger MISSING - Run migration!'
  END as status;

-- Step 2: Check if function exists
SELECT 
  'Function Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_invoice_void'
        AND pronamespace = 'public'::regnamespace
    ) THEN '✅ Function EXISTS'
    ELSE '❌ Function MISSING - Run migration!'
  END as status;

-- Step 3: List all issued invoices
SELECT 
  'Available Invoices' as info,
  id,
  invoice_number,
  status,
  total_amount,
  subtotal,
  gst_amount
FROM invoices
WHERE status = 'issued'
LIMIT 5;

-- Step 4: Try to manually void one invoice (SAFE - uses transaction)
-- REPLACE 'YOUR-INVOICE-ID' with actual ID from above
DO $$
DECLARE
  test_id uuid := 'YOUR-INVOICE-ID-HERE'; -- REPLACE THIS!
  old_status text;
  new_status text;
  reversal_count int;
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM invoices WHERE id = test_id;
  
  IF old_status IS NULL THEN
    RAISE NOTICE '❌ Invoice not found with ID: %', test_id;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing void on invoice with status: %', old_status;
  
  -- Try to update
  BEGIN
    UPDATE invoices SET status = 'cancelled' WHERE id = test_id;
    
    -- Check new status
    SELECT status INTO new_status FROM invoices WHERE id = test_id;
    RAISE NOTICE '✅ Status updated: % → %', old_status, new_status;
    
    -- Check for reversal
    SELECT COUNT(*) INTO reversal_count
    FROM transactions
    WHERE source_id = test_id AND description LIKE 'REVERSAL:%';
    
    IF reversal_count > 0 THEN
      RAISE NOTICE '✅ Reversal transaction created';
    ELSE
      RAISE NOTICE '❌ NO REVERSAL CREATED - Trigger not working!';
    END IF;
    
    -- Rollback
    RAISE EXCEPTION 'Test complete - rolling back';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error during void: %', SQLERRM;
      RAISE;
  END;
END $$;

-- Step 5: Check RLS policies
SELECT 
  'RLS Policies' as info,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'UPDATE' THEN '✅ UPDATE allowed'
    ELSE cmd::text
  END as permission
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY cmd;
