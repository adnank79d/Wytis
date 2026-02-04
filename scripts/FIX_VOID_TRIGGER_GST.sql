-- ============================================================================
-- FIX: Remove is_interstate dependency from void trigger
-- ============================================================================
-- The invoices table doesn't have is_interstate field
-- Simplify to use single GST account
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_invoice_void_simple()
RETURNS TRIGGER AS $$
DECLARE
  v_reversal_txn_id uuid;
BEGIN
  -- Only on issued → cancelled
  IF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'cancelled' THEN
    
    -- Check if reversal already exists
    IF EXISTS (
      SELECT 1 FROM public.transactions
      WHERE source_type = 'invoice' 
        AND source_id = NEW.id
        AND description LIKE 'REVERSAL:%'
    ) THEN
      RETURN NEW; -- Already reversed
    END IF;
    
    -- Create reversal transaction
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount,
      transaction_type, transaction_date, description
    ) VALUES (
      NEW.business_id, 'invoice', NEW.id, NEW.total_amount,
      'debit', CURRENT_DATE,
      'REVERSAL: Invoice #' || NEW.invoice_number
    ) RETURNING id INTO v_reversal_txn_id;
    
    -- Reversal 1: Credit Accounts Receivable (opposite of original debit)
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES (NEW.business_id, v_reversal_txn_id, 'Accounts Receivable', 0, NEW.total_amount);
    
    -- Reversal 2: Debit Sales (opposite of original credit)
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES (NEW.business_id, v_reversal_txn_id, 'Sales', NEW.subtotal, 0);
    
    -- Reversal 3: Debit GST (opposite of original credit) - ONLY if GST > 0
    IF NEW.gst_amount > 0 THEN
      -- Use single GST account (simplified - no interstate check)
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, v_reversal_txn_id, 'Output GST', NEW.gst_amount, 0);
    END IF;
    
    RAISE NOTICE 'Created reversal for invoice % (GST: %)', NEW.invoice_number, NEW.gst_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS invoice_void_trigger_simple ON public.invoices;

CREATE TRIGGER invoice_void_trigger_simple
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_void_simple();

-- Test message
DO $$
BEGIN
  RAISE NOTICE '✅ Void trigger updated - is_interstate dependency removed';
  RAISE NOTICE 'GST reversals now use single "Output GST" account';
END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
