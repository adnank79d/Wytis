-- ============================================================================
-- FINAL VOID FIX - Run this to completely fix the void functionality
-- ============================================================================
-- This script:
-- 1. Drops ALL existing void triggers
-- 2. Creates clean trigger WITHOUT is_interstate dependency
-- 3. Ensures 'cancelled' status is allowed
-- 4. Sets up proper RLS
-- ============================================================================

-- Step 1: Drop ALL existing void-related triggers
DROP TRIGGER IF EXISTS invoice_void_trigger ON public.invoices;
DROP TRIGGER IF EXISTS invoice_void_trigger_simple ON public.invoices;
DROP TRIGGER IF EXISTS invoice_cancellation_trigger ON public.invoices;
DROP TRIGGER IF EXISTS handle_invoice_void ON public.invoices;

-- Step 2: Drop old functions
DROP FUNCTION IF EXISTS public.handle_invoice_void();
DROP FUNCTION IF EXISTS public.handle_invoice_void_simple();
DROP FUNCTION IF EXISTS public.handle_invoice_cancellation();

-- Step 3: Ensure status constraint allows 'cancelled'
DO $$
BEGIN
  ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
  ALTER TABLE public.invoices
    ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'overdue', 'voided'));
  RAISE NOTICE '✅ Status constraint updated';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Note: %', SQLERRM;
END $$;

-- Step 4: Create NEW clean void function (NO is_interstate)
CREATE OR REPLACE FUNCTION public.handle_invoice_void_clean()
RETURNS TRIGGER AS $$
DECLARE
  v_reversal_txn_id uuid;
BEGIN
  -- Trigger on: (issued OR paid) → cancelled
  IF TG_OP = 'UPDATE' 
     AND (OLD.status = 'issued' OR OLD.status = 'paid') 
     AND NEW.status = 'cancelled' THEN
    
    -- Check if reversal already exists (idempotency)
    IF EXISTS (
      SELECT 1 FROM public.transactions
      WHERE source_type = 'invoice' 
        AND source_id = NEW.id
        AND description LIKE 'REVERSAL:%'
    ) THEN
      RAISE NOTICE 'Reversal already exists for invoice %', NEW.invoice_number;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Creating reversal for invoice % (status: % -> %)', NEW.invoice_number, OLD.status, NEW.status;
    
    -- Create reversal transaction
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount,
      transaction_type, transaction_date, description
    ) VALUES (
      NEW.business_id, 'invoice', NEW.id, NEW.total_amount,
      'debit', CURRENT_DATE,
      'REVERSAL: Invoice #' || NEW.invoice_number
    ) RETURNING id INTO v_reversal_txn_id;
    
    RAISE NOTICE 'Reversal transaction ID: %', v_reversal_txn_id;
    
    -- Create reversal ledger entries
    -- Entry 1: Credit AR (opposite of original debit)
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES (NEW.business_id, v_reversal_txn_id, 'Accounts Receivable', 0, NEW.total_amount);
    
    -- Entry 2: Debit Sales (opposite of original credit)
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES (NEW.business_id, v_reversal_txn_id, 'Sales', NEW.subtotal, 0);
    
    -- Entry 3: Debit GST (opposite of original credit) - ONLY if GST > 0
    IF NEW.gst_amount > 0 THEN
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, v_reversal_txn_id, 'Output GST', NEW.gst_amount, 0);
      
      RAISE NOTICE 'Created GST reversal: %', NEW.gst_amount;
    END IF;
    
    RAISE NOTICE '✅ Successfully created reversal for invoice %', NEW.invoice_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Drop and recreate trigger (safe to re-run)
DROP TRIGGER IF EXISTS invoice_void_trigger_clean ON public.invoices;

CREATE TRIGGER invoice_void_trigger_clean
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_void_clean();

-- Step 6: Update RLS policy
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

-- Verification
DO $$
DECLARE
  trigger_count int;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'public.invoices'::regclass
    AND tgname = 'invoice_void_trigger_clean';
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ VOID FUNCTIONALITY SETUP COMPLETE';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger Status: %', CASE WHEN trigger_count > 0 THEN '✅ Active' ELSE '❌ Missing' END;
  RAISE NOTICE '';
  RAISE NOTICE 'To void an invoice:';
  RAISE NOTICE '  UPDATE invoices SET status = ''cancelled'' WHERE id = ''...'';';
  RAISE NOTICE '';
  RAISE NOTICE 'The trigger will automatically:';
  RAISE NOTICE '  - Create reversal transaction';
  RAISE NOTICE '  - Credit Accounts Receivable';
  RAISE NOTICE '  - Debit Sales';
  RAISE NOTICE '  - Debit Output GST (if applicable)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
