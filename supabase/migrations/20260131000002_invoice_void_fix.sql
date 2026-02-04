-- ============================================================================
-- INVOICE VOID FUNCTIONALITY - COMPLETE IMPLEMENTATION
-- ============================================================================
-- Purpose: Implement void as UPDATE (issued → cancelled) with reversals
-- Rules:
--   1. Void = UPDATE status, never DELETE
--   2. Creates reversing ledger entries (append-only)
--   3. Original entries remain untouched
--   4. Works with zero GST
--   5. RLS allows authorized updates
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ENSURE RLS ALLOWS STATUS UPDATES
-- ============================================================================

-- Check current RLS policies on invoices
DO $$
BEGIN
  RAISE NOTICE 'Checking RLS policies on invoices table...';
END $$;

-- Drop and recreate UPDATE policy to ensure void works
DROP POLICY IF EXISTS "Users can update invoices in their business" ON public.invoices;

CREATE POLICY "Users can update invoices in their business"
  ON public.invoices
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.memberships 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM public.memberships 
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can update invoices in their business" ON public.invoices IS
'Allows users to update invoices (including status changes for void) in their business';

-- ============================================================================
-- STEP 2: INVOICE CANCELLATION TRIGGER (Idempotent Reversal)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_invoice_void()
RETURNS TRIGGER AS $$
DECLARE
  v_reversal_txn_id uuid;
  v_existing_reversal uuid;
  v_original_txn_id uuid;
BEGIN
  -- Guard: Only trigger on issued → cancelled transition
  IF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'cancelled' THEN
    
    -- Check if already reversed (idempotency)
    SELECT id INTO v_existing_reversal
    FROM public.transactions
    WHERE source_type = 'invoice' 
      AND source_id = NEW.id
      AND description LIKE 'REVERSAL:%';
    
    IF v_existing_reversal IS NOT NULL THEN
      -- Already reversed, skip
      RAISE NOTICE 'Invoice % already has reversal transaction', NEW.invoice_number;
      RETURN NEW;
    END IF;
    
    -- Find original transaction
    SELECT id INTO v_original_txn_id
    FROM public.transactions
    WHERE source_type = 'invoice' 
      AND source_id = NEW.id
      AND description NOT LIKE 'REVERSAL:%'
    LIMIT 1;
    
    IF v_original_txn_id IS NULL THEN
      RAISE NOTICE 'No original transaction found for invoice %. Skipping reversal.', NEW.invoice_number;
      RETURN NEW;
    END IF;
    
    -- Create reversal transaction
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount,
      transaction_type, transaction_date, description
    ) VALUES (
      NEW.business_id, 'invoice', NEW.id, NEW.total_amount,
      'debit', CURRENT_DATE,
      'REVERSAL: Invoice #' || NEW.invoice_number || ' (Voided)'
    ) RETURNING id INTO v_reversal_txn_id;
    
    RAISE NOTICE 'Created reversal transaction % for invoice %', v_reversal_txn_id, NEW.invoice_number;
    
    -- Create EXACTLY 3 REVERSING ledger entries (opposite signs)
    
    -- Reversal 1: Credit Accounts Receivable (Asset decreases)
    INSERT INTO public.ledger_entries (
      business_id, transaction_id, account_name, debit, credit
    ) VALUES (
      NEW.business_id, v_reversal_txn_id, 'Accounts Receivable', 0, NEW.total_amount
    );
    
    -- Reversal 2: Debit Sales (Revenue decreases)
    INSERT INTO public.ledger_entries (
      business_id, transaction_id, account_name, debit, credit
    ) VALUES (
      NEW.business_id, v_reversal_txn_id, 'Sales', NEW.subtotal, 0
    );
    
    -- Reversal 3: Debit GST Payable (Liability decreases) - ONLY if GST > 0
    IF NEW.gst_amount > 0 THEN
      IF NEW.is_interstate THEN
        -- IGST reversal
        INSERT INTO public.ledger_entries (
          business_id, transaction_id, account_name, debit, credit
        ) VALUES (
          NEW.business_id, v_reversal_txn_id, 'Output IGST', NEW.gst_amount, 0
        );
      ELSE
        -- CGST + SGST reversal
        INSERT INTO public.ledger_entries (
          business_id, transaction_id, account_name, debit, credit
        ) VALUES 
          (NEW.business_id, v_reversal_txn_id, 'Output CGST', NEW.gst_amount / 2, 0),
          (NEW.business_id, v_reversal_txn_id, 'Output SGST', NEW.gst_amount / 2, 0);
      END IF;
      
      RAISE NOTICE 'Created GST reversal entries for amount %', NEW.gst_amount;
    ELSE
      RAISE NOTICE 'No GST reversal needed (GST amount is zero)';
    END IF;
    
    -- Audit log (if table exists)
    BEGIN
      INSERT INTO public.audit_logs (
        business_id, user_id, action, entity_type, entity_id, details
      ) VALUES (
        NEW.business_id, auth.uid(), 'invoice_voided', 'invoice', NEW.id,
        jsonb_build_object(
          'invoice_number', NEW.invoice_number,
          'amount', NEW.total_amount,
          'reversal_transaction_id', v_reversal_txn_id,
          'original_transaction_id', v_original_txn_id
        )
      );
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'audit_logs table does not exist, skipping audit';
    END;
    
    RAISE NOTICE '✅ Successfully voided invoice % with reversal entries', NEW.invoice_number;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS invoice_void_trigger ON public.invoices;
DROP TRIGGER IF EXISTS invoice_cancellation_trigger ON public.invoices;

-- Create new trigger
CREATE TRIGGER invoice_void_trigger
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_void();

COMMENT ON FUNCTION public.handle_invoice_void() IS
'Creates reversing ledger entries when invoice status changes from issued to cancelled. Maintains immutable audit trail.';

-- ============================================================================
-- STEP 3: VERIFICATION TESTS
-- ============================================================================

-- Test 1: Verify trigger exists
DO $$
DECLARE
  trigger_count int;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'invoice_void_trigger';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: Void trigger exists';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: Void trigger not found';
  END IF;
END $$;

-- Test 2: Verify RLS policy allows updates
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'invoices' 
    AND policyname LIKE '%update%'
    AND cmd = 'UPDATE';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ TEST 2 PASSED: RLS allows invoice updates';
  ELSE
    RAISE WARNING '⚠️  TEST 2 WARNING: No UPDATE policy found for invoices';
  END IF;
END $$;

-- Test 3: Verify delete protection still works
DO $$
DECLARE
  trigger_count int;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname LIKE '%delete%' 
    AND tgrelid = 'public.invoices'::regclass;
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: Delete protection trigger exists';
  ELSE
    RAISE WARNING '⚠️  TEST 3 WARNING: No delete protection found';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- MANUAL TEST SUITE (Run these manually to verify)
-- ============================================================================

-- TEST A: Create a test invoice (issued status)
/*
INSERT INTO invoices (
  business_id, customer_name, invoice_number, invoice_date,
  subtotal, gst_amount, total_amount, status, is_interstate
) VALUES (
  (SELECT business_id FROM memberships LIMIT 1),
  'Test Customer',
  'TEST-VOID-001',
  CURRENT_DATE,
  1000.00,
  180.00,
  1180.00,
  'issued',
  false
);

-- Verify ledger entries were created
SELECT 
  t.description,
  l.account_name,
  l.debit,
  l.credit
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
WHERE t.source_id = (SELECT id FROM invoices WHERE invoice_number = 'TEST-VOID-001')
ORDER BY l.account_name;

-- Expected: 3 entries (AR debit, Sales credit, GST credit)
*/

-- TEST B: Void the invoice
/*
UPDATE invoices 
SET status = 'cancelled'
WHERE invoice_number = 'TEST-VOID-001';

-- Verify reversal entries were created
SELECT 
  t.description,
  l.account_name,
  l.debit,
  l.credit
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
WHERE t.source_id = (SELECT id FROM invoices WHERE invoice_number = 'TEST-VOID-001')
ORDER BY t.transaction_date, l.account_name;

-- Expected: 6 entries total (3 original + 3 reversal)
*/

-- TEST C: Verify net balances are zero
/*
SELECT 
  l.account_name,
  SUM(l.debit - l.credit) as net_balance
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
WHERE t.source_id = (SELECT id FROM invoices WHERE invoice_number = 'TEST-VOID-001')
GROUP BY l.account_name;

-- Expected: All balances should be 0.00
*/

-- TEST D: Test with zero GST
/*
INSERT INTO invoices (
  business_id, customer_name, invoice_number, invoice_date,
  subtotal, gst_amount, total_amount, status, is_interstate
) VALUES (
  (SELECT business_id FROM memberships LIMIT 1),
  'Test Customer 2',
  'TEST-VOID-002',
  CURRENT_DATE,
  1000.00,
  0.00,
  1000.00,
  'issued',
  false
);

-- Void it
UPDATE invoices 
SET status = 'cancelled'
WHERE invoice_number = 'TEST-VOID-002';

-- Verify only 2 reversal entries (no GST)
SELECT COUNT(*) as reversal_entry_count
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
WHERE t.source_id = (SELECT id FROM invoices WHERE invoice_number = 'TEST-VOID-002')
  AND t.description LIKE 'REVERSAL:%';

-- Expected: 2 entries (AR, Sales only - no GST)
*/

-- TEST E: Verify delete is still blocked
/*
DELETE FROM invoices WHERE invoice_number = 'TEST-VOID-001';
-- Expected: ERROR - Cannot delete issued/cancelled invoice
*/

-- TEST F: Verify idempotency (void twice)
/*
UPDATE invoices SET status = 'cancelled' WHERE invoice_number = 'TEST-VOID-001';
UPDATE invoices SET status = 'cancelled' WHERE invoice_number = 'TEST-VOID-001';

-- Should not create duplicate reversals
SELECT COUNT(*) as reversal_count
FROM transactions
WHERE source_id = (SELECT id FROM invoices WHERE invoice_number = 'TEST-VOID-001')
  AND description LIKE 'REVERSAL:%';

-- Expected: 1 (only one reversal transaction)
*/

-- ============================================================================
-- CLEANUP TEST DATA (Run after testing)
-- ============================================================================
/*
-- Note: These will fail due to delete protection, which is correct!
-- DELETE FROM invoices WHERE invoice_number LIKE 'TEST-VOID-%';

-- To clean up, you'd need to use service_role or manually remove via Supabase dashboard
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ INVOICE VOID FUNCTIONALITY DEPLOYED';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPLEMENTATION:';
  RAISE NOTICE '  ✓ Void = UPDATE (issued → cancelled)';
  RAISE NOTICE '  ✓ Creates reversing ledger entries';
  RAISE NOTICE '  ✓ Original entries remain untouched';
  RAISE NOTICE '  ✓ Works with zero GST';
  RAISE NOTICE '  ✓ Idempotent (safe to retry)';
  RAISE NOTICE '';
  RAISE NOTICE 'USAGE:';
  RAISE NOTICE '  UPDATE invoices SET status = ''cancelled'' WHERE id = ''...'';';
  RAISE NOTICE '';
  RAISE NOTICE 'VERIFICATION:';
  RAISE NOTICE '  Run manual tests (TEST A-F) to verify functionality';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
