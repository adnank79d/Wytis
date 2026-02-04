-- ============================================================================
-- WYTIS ACCOUNTING SYSTEM - CRITICAL FIXES (CORRECTED)
-- ============================================================================
-- Apply this in Supabase SQL Editor to fix all accounting violations
-- ============================================================================

-- ============================================================================
-- FIX 1: INVOICE PAYMENT TRIGGER (Move logic from app to database)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  trx_id uuid;
  existing_payment_txn uuid;
BEGIN
  -- Guard: Only on status change from issued → paid
  IF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'paid' THEN
    
    -- IDEMPOTENCY CHECK: Prevent duplicate payment transactions
    -- Look for existing transaction with description containing 'Payment'
    SELECT id INTO existing_payment_txn
    FROM public.transactions
    WHERE source_type = 'invoice'
      AND source_id = NEW.id
      AND business_id = NEW.business_id
      AND description LIKE '%Payment%'
    LIMIT 1;
    
    IF existing_payment_txn IS NOT NULL THEN
      -- Payment transaction already exists, skip
      RAISE NOTICE 'Payment transaction already exists for invoice %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Set paid_at timestamp
    NEW.paid_at := COALESCE(NEW.paid_at, now());
    
    -- Create payment transaction
    -- NOTE: Using 'invoice' as source_type (not 'payment') to avoid constraint violation
    INSERT INTO public.transactions (
      business_id, 
      source_type, 
      source_id, 
      amount, 
      transaction_type, 
      transaction_date,
      description
    ) VALUES (
      NEW.business_id, 
      'invoice',  -- Using 'invoice' to match constraint
      NEW.id, 
      NEW.total_amount,
      'debit',
      NEW.paid_at,
      'Payment for Invoice ' || NEW.invoice_number
    ) RETURNING id INTO trx_id;
    
    -- Ledger Entry 1: Debit Bank (Asset increases)
    INSERT INTO public.ledger_entries (
      business_id, 
      transaction_id, 
      account_name, 
      debit, 
      credit
    ) VALUES (
      NEW.business_id, 
      trx_id, 
      'Bank', 
      NEW.total_amount, 
      0
    );
    
    -- Ledger Entry 2: Credit Accounts Receivable (Asset decreases)
    INSERT INTO public.ledger_entries (
      business_id, 
      transaction_id, 
      account_name, 
      debit, 
      credit
    ) VALUES (
      NEW.business_id, 
      trx_id, 
      'Accounts Receivable', 
      0, 
      NEW.total_amount
    );
    
    -- Audit log
    INSERT INTO public.audit_logs (
      business_id, 
      user_id, 
      action, 
      entity_type, 
      entity_id, 
      details
    ) VALUES (
      NEW.business_id, 
      auth.uid(), 
      'invoice_paid', 
      'invoice', 
      NEW.id,
      jsonb_build_object(
        'invoice_number', NEW.invoice_number, 
        'amount', NEW.total_amount,
        'transaction_id', trx_id
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_invoice_paid_trigger ON public.invoices;
CREATE TRIGGER on_invoice_paid_trigger
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  WHEN (OLD.status = 'issued' AND NEW.status = 'paid')
  EXECUTE FUNCTION public.handle_invoice_paid();

-- ============================================================================
-- FIX 2: INVOICE DELETION TRIGGER (Correct column names)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_invoice_financial_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete GST records (uses source_id + source_type, NOT invoice_id!)
  DELETE FROM public.gst_records
  WHERE source_id = OLD.id AND source_type = 'invoice';

  -- Delete ledger entries associated with transactions for this invoice
  -- Include both issuance and payment transactions
  DELETE FROM public.ledger_entries
  WHERE transaction_id IN (
    SELECT id FROM public.transactions
    WHERE source_type = 'invoice' AND source_id = OLD.id
  );

  -- Delete transactions for this invoice (both issuance and payment)
  DELETE FROM public.transactions
  WHERE source_type = 'invoice' AND source_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
CREATE TRIGGER trigger_cleanup_invoice_financials
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_invoice_financial_records();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check triggers are installed
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname IN ('on_invoice_paid_trigger', 'trigger_cleanup_invoice_financials')
ORDER BY tgname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Accounting fixes applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. Invoice payment now creates ledger entries via trigger';
  RAISE NOTICE '2. Invoice deletion properly cleans up all financial records';
  RAISE NOTICE '3. Fixed source_type constraint issue (using invoice instead of payment)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Reset your financial data: node scripts/reset_financial_data.js';
  RAISE NOTICE '2. Test invoice flow: Create → Issue → Pay';
  RAISE NOTICE '3. Verify dashboard shows correct values';
END $$;
