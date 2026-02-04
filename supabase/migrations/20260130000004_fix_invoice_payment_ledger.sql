-- Migration: 20260130000004_fix_invoice_payment_ledger
-- Description: Move payment ledger logic from app code to database trigger
-- Purpose: Enforce ledger-first architecture and single source of truth

-- ============================================================================
-- FIX INVOICE PAYMENT TRIGGER
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
    SELECT id INTO existing_payment_txn
    FROM public.transactions
    WHERE source_type = 'payment' 
      AND source_id = NEW.id
      AND business_id = NEW.business_id
    LIMIT 1;
    
    IF existing_payment_txn IS NOT NULL THEN
      -- Payment transaction already exists, skip
      RAISE NOTICE 'Payment transaction already exists for invoice %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Set paid_at timestamp
    NEW.paid_at := COALESCE(NEW.paid_at, now());
    
    -- Create payment transaction
    INSERT INTO public.transactions (
      business_id, 
      source_type, 
      source_id, 
      amount, 
      transaction_type, 
      transaction_date
    ) VALUES (
      NEW.business_id, 
      'payment',  -- Use 'payment' to distinguish from invoice issuance
      NEW.id, 
      NEW.total_amount,
      'debit',  -- Money coming in
      NEW.paid_at
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

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_invoice_paid_trigger ON public.invoices;
CREATE TRIGGER on_invoice_paid_trigger
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  WHEN (OLD.status = 'issued' AND NEW.status = 'paid')
  EXECUTE FUNCTION public.handle_invoice_paid();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- After applying, you can verify with:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_invoice_paid_trigger';
