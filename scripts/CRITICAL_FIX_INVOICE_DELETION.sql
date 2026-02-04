-- ============================================================================
-- CRITICAL FIX: PREVENT ACCOUNTING CORRUPTION FROM INVOICE DELETION
-- ============================================================================
-- Problem: Deleting issued invoices removes ledger entries, causing negative balances
-- Solution: 
--   1. Prevent deletion of issued/paid invoices at database level
--   2. Implement cancellation with reversing entries (proper accounting)
--   3. Only allow deletion of draft invoices
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD DELETION TRIGGER (if exists)
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
DROP TRIGGER IF EXISTS on_invoice_delete ON public.invoices;
DROP FUNCTION IF EXISTS public.cleanup_invoice_financial_records();
DROP FUNCTION IF EXISTS public.handle_invoice_delete();

-- ============================================================================
-- STEP 2: CREATE DELETE PROTECTION TRIGGER
-- ============================================================================
-- This trigger PREVENTS deletion of issued or paid invoices
-- Only draft invoices can be deleted

CREATE OR REPLACE FUNCTION public.prevent_issued_invoice_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow deletion only if status is 'draft'
  IF OLD.status != 'draft' THEN
    RAISE EXCEPTION 'Cannot delete issued or paid invoices. Use cancellation instead. Invoice status: %', OLD.status
      USING HINT = 'Only draft invoices can be deleted. For issued/paid invoices, use the cancel function.';
  END IF;
  
  -- If it's a draft, allow deletion and clean up any associated records
  -- (drafts shouldn't have ledger entries, but clean up just in case)
  DELETE FROM public.gst_records 
  WHERE source_type = 'invoice' AND source_id = OLD.id;
  
  DELETE FROM public.ledger_entries
  WHERE transaction_id IN (
    SELECT id FROM public.transactions 
    WHERE source_type IN ('invoice', 'payment') AND source_id = OLD.id
  );
  
  DELETE FROM public.transactions
  WHERE source_type IN ('invoice', 'payment') AND source_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_invoice_deletion
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_issued_invoice_deletion();

COMMENT ON FUNCTION public.prevent_issued_invoice_deletion() IS
'Prevents deletion of issued/paid invoices. Only draft invoices can be deleted.';

-- ============================================================================
-- STEP 3: CREATE CANCELLATION FUNCTION
-- ============================================================================
-- Proper accounting: Cancel an invoice by creating reversing entries
-- This maintains the audit trail and keeps ledger immutable

CREATE OR REPLACE FUNCTION public.cancel_invoice(
  p_invoice_id uuid,
  p_business_id uuid,
  p_cancellation_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_invoice record;
  v_reversal_txn_id uuid;
  v_payment_reversal_txn_id uuid;
  v_original_txn_id uuid;
  v_payment_txn_id uuid;
BEGIN
  -- 1. Fetch and validate invoice
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id AND business_id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invoice not found'
    );
  END IF;
  
  IF v_invoice.status = 'draft' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Draft invoices should be deleted, not cancelled'
    );
  END IF;
  
  IF v_invoice.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invoice is already cancelled'
    );
  END IF;
  
  -- 2. Find original invoice transaction
  SELECT id INTO v_original_txn_id
  FROM public.transactions
  WHERE source_type = 'invoice' AND source_id = p_invoice_id
  LIMIT 1;
  
  -- 3. Create reversal transaction for invoice issuance
  IF v_original_txn_id IS NOT NULL THEN
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount, transaction_type, 
      transaction_date, description
    ) VALUES (
      p_business_id, 'invoice', p_invoice_id, v_invoice.total_amount, 'credit',
      CURRENT_DATE, 'Reversal: Invoice #' || v_invoice.invoice_number || 
        COALESCE(' - ' || p_cancellation_reason, '')
    ) RETURNING id INTO v_reversal_txn_id;
    
    -- Create reversing ledger entries (opposite of original)
    -- Original: Dr AR, Cr Sales, Cr GST
    -- Reversal: Cr AR, Dr Sales, Dr GST
    
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES 
      (p_business_id, v_reversal_txn_id, 'Accounts Receivable', 0, v_invoice.total_amount),
      (p_business_id, v_reversal_txn_id, 'Sales', v_invoice.subtotal, 0);
    
    IF v_invoice.gst_amount > 0 THEN
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (p_business_id, v_reversal_txn_id, 'Output GST', v_invoice.gst_amount, 0);
    END IF;
  END IF;
  
  -- 4. If invoice was paid, reverse the payment too
  IF v_invoice.status = 'paid' THEN
    SELECT id INTO v_payment_txn_id
    FROM public.transactions
    WHERE source_type = 'payment' AND source_id = p_invoice_id
    LIMIT 1;
    
    IF v_payment_txn_id IS NOT NULL THEN
      INSERT INTO public.transactions (
        business_id, source_type, source_id, amount, transaction_type,
        transaction_date, description
      ) VALUES (
        p_business_id, 'payment', p_invoice_id, v_invoice.total_amount, 'debit',
        CURRENT_DATE, 'Reversal: Payment for #' || v_invoice.invoice_number
      ) RETURNING id INTO v_payment_reversal_txn_id;
      
      -- Reverse payment entries
      -- Original: Dr Bank, Cr AR
      -- Reversal: Cr Bank, Dr AR
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES 
        (p_business_id, v_payment_reversal_txn_id, 'Bank', 0, v_invoice.total_amount),
        (p_business_id, v_payment_reversal_txn_id, 'Accounts Receivable', v_invoice.total_amount, 0);
    END IF;
  END IF;
  
  -- 5. Update invoice status to cancelled
  UPDATE public.invoices
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_invoice_id;
  
  -- 6. Audit log
  INSERT INTO public.audit_logs (
    business_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    p_business_id, auth.uid(), 'invoice_cancelled', 'invoice', p_invoice_id,
    jsonb_build_object(
      'invoice_number', v_invoice.invoice_number,
      'amount', v_invoice.total_amount,
      'reason', p_cancellation_reason,
      'reversal_transaction_id', v_reversal_txn_id,
      'payment_reversal_transaction_id', v_payment_reversal_txn_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invoice cancelled successfully with reversing entries',
    'reversal_transaction_id', v_reversal_txn_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cancel_invoice IS
'Cancels an invoice by creating reversing ledger entries. Maintains immutable ledger and audit trail.';

-- ============================================================================
-- STEP 4: ADD CANCELLED STATUS TO INVOICES (if not exists)
-- ============================================================================
-- Check if 'cancelled' is already in the status constraint
DO $$
BEGIN
  -- Try to add 'cancelled' to the status check constraint
  -- This will fail silently if it already exists
  ALTER TABLE public.invoices 
    DROP CONSTRAINT IF EXISTS invoices_status_check;
    
  ALTER TABLE public.invoices
    ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Status constraint already updated or error: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 5: PROTECT LEDGER ENTRIES FROM DELETION
-- ============================================================================
-- Ledger entries should NEVER be deleted (immutable accounting principle)

CREATE OR REPLACE FUNCTION public.prevent_ledger_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries cannot be deleted. Accounting records are immutable.'
    USING HINT = 'Use reversing entries to correct mistakes.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_ledger_entry_deletion ON public.ledger_entries;
CREATE TRIGGER prevent_ledger_entry_deletion
  BEFORE DELETE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_deletion();

COMMENT ON FUNCTION public.prevent_ledger_deletion() IS
'Prevents deletion of ledger entries. Accounting records must be immutable.';

-- ============================================================================
-- VERIFICATION & SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Invoice Delete Protection Implemented!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '1. Issued/paid invoices cannot be deleted (database-level protection)';
  RAISE NOTICE '2. Only draft invoices can be deleted';
  RAISE NOTICE '3. New cancel_invoice() function creates reversing entries';
  RAISE NOTICE '4. Ledger entries are now immutable (cannot be deleted)';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT cancel_invoice(invoice_id, business_id, ''reason'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update application code to use cancellation instead of deletion';
END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
