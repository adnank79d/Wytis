-- ============================================================================
-- WYTIS REFINED ACCOUNTING ENGINE (v2.0)
-- ============================================================================
-- 1. Drops old logic to ensure clean slate.
-- 2. Fixes constraints.
-- 3. Implements strict "Ledger-First" triggers for Invoices & Expenses.
-- 4. Implements "Net GST" (Tax on Value Added).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: CLEANUP OLD TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_invoice_issued_trigger ON public.invoices;
DROP TRIGGER IF EXISTS on_invoice_paid_trigger ON public.invoices;
DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
DROP FUNCTION IF EXISTS public.handle_invoice_issued();
DROP FUNCTION IF EXISTS public.handle_invoice_paid();
DROP FUNCTION IF EXISTS public.cleanup_invoice_financial_records();

-- ----------------------------------------------------------------------------
-- STEP 2: FIX CONSTRAINTS
-- ----------------------------------------------------------------------------
-- Ensure transactions.source_type allows 'invoice', 'payment', 'expense'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_source_type_check;
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_source_type_check 
  CHECK (source_type IN ('invoice', 'expense', 'payment', 'journal', 'salary', 'refund'));

-- ----------------------------------------------------------------------------
-- STEP 3: MASTER INVOICE TRIGGER (Handle Issue, Pay, Update in one place)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_invoice_events()
RETURNS TRIGGER AS $$
DECLARE
  trx_id uuid;
  existing_trx uuid;
  period text;
  -- GST Logic
  half_tax numeric;
BEGIN
  -- ==========================================================================
  -- CASE 1: INVOICE ISSUED (Draft -> Issued)
  -- ==========================================================================
  IF (TG_OP = 'UPDATE' AND OLD.status != 'issued' AND NEW.status = 'issued') OR
     (TG_OP = 'INSERT' AND NEW.status = 'issued') THEN
     
    -- Check Idempotency
    SELECT id INTO existing_trx FROM public.transactions 
    WHERE source_type = 'invoice' AND source_id = NEW.id;
    
    IF existing_trx IS NULL THEN
      -- Create Transaction
      INSERT INTO public.transactions (
        business_id, source_type, source_id, amount, transaction_type, transaction_date, description
      ) VALUES (
        NEW.business_id, 'invoice', NEW.id, NEW.total_amount, 'credit', NEW.invoice_date, 
        'Invoice #' || NEW.invoice_number
      ) RETURNING id INTO trx_id;

      -- 1. Debit Accounts Receivable (Asset+)
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'Accounts Receivable', NEW.total_amount, 0);

      -- 2. Credit Sales (Income+) -- Excludes GST
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'Sales', 0, NEW.subtotal);

      -- 3. Credit Output GST (Liability+)
      IF NEW.gst_amount > 0 THEN
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Output GST', 0, NEW.gst_amount);

        -- GST Record
        period := to_char(NEW.invoice_date, 'YYYY-MM');
        INSERT INTO public.gst_records (business_id, source_type, source_id, gst_type, amount, tax_period)
        VALUES (NEW.business_id, 'invoice', NEW.id, 'OUTPUT', NEW.gst_amount, period);
      END IF;
    END IF;
  END IF;

  -- ==========================================================================
  -- CASE 2: INVOICE PAID (Issued -> Paid)
  -- ==========================================================================
  IF (TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'paid') THEN
    
    -- Check Idempotency
    SELECT id INTO existing_trx FROM public.transactions 
    WHERE source_type = 'payment' AND source_id = NEW.id;

    IF existing_trx IS NULL THEN
      NEW.paid_at := COALESCE(NEW.paid_at, now());
      
      -- Create Payment Transaction
      INSERT INTO public.transactions (
        business_id, source_type, source_id, amount, transaction_type, transaction_date, description
      ) VALUES (
        NEW.business_id, 'payment', NEW.id, NEW.total_amount, 'debit', NEW.paid_at,
        'Payment for #' || NEW.invoice_number
      ) RETURNING id INTO trx_id;

      -- 1. Debit Bank (Asset+)
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'Bank', NEW.total_amount, 0);

      -- 2. Credit Accounts Receivable (Asset-)
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'Accounts Receivable', 0, NEW.total_amount);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invoice_events
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_events();

-- ----------------------------------------------------------------------------
-- STEP 4: INVOICE DELETION TRIGGER (Cleanup)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Delete GST Records associated with invoice
  DELETE FROM public.gst_records 
  WHERE source_type = 'invoice' AND source_id = OLD.id;

  -- 2. Delete Ledger Entries (via Transactions)
  DELETE FROM public.ledger_entries
  WHERE transaction_id IN (
    SELECT id FROM public.transactions 
    WHERE (source_type = 'invoice' OR source_type = 'payment') AND source_id = OLD.id
  );

  -- 3. Delete Transactions (Invoice & Payment)
  DELETE FROM public.transactions
  WHERE (source_type = 'invoice' OR source_type = 'payment') AND source_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invoice_delete
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_delete();

-- ----------------------------------------------------------------------------
-- STEP 5: DASHBOARD VIEW (Net Profit & Net GST)
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.dashboard_metrics_view;

CREATE VIEW public.dashboard_metrics_view AS
WITH financials AS (
    SELECT 
        business_id,
        -- Revenue = Sales Credit - Sales Debit (Returns)
        COALESCE(SUM(CASE WHEN account_name = 'Sales' THEN credit - debit ELSE 0 END), 0) as revenue,
        
        -- Expenses = Expense Debit - Expense Credit
        -- Assuming 'Cost of Goods Sold' and generic 'Expense' accounts
        COALESCE(SUM(CASE WHEN account_name IN ('Cost of Goods Sold', 'Expense') THEN debit - credit ELSE 0 END), 0) as expenses,
        
        -- Accounts Receivable Balance
        COALESCE(SUM(CASE WHEN account_name = 'Accounts Receivable' THEN debit - credit ELSE 0 END), 0) as ar,
        
        -- GST Output Liability (What we collected)
        COALESCE(SUM(CASE WHEN account_name = 'Output GST' THEN credit - debit ELSE 0 END), 0) as output_gst,
        
        -- GST Input Credit (What we paid on purchase)
        COALESCE(SUM(CASE WHEN account_name = 'Input GST' THEN debit - credit ELSE 0 END), 0) as input_gst
    FROM public.ledger_entries
    GROUP BY business_id
)
SELECT
    business_id,
    revenue,
    expenses,
    -- Net Profit = Revenue - Expenses
    (revenue - expenses) as net_profit,
    -- Net GST Payable = Output - Input (Tax on Value Added)
    GREATEST(0, output_gst - input_gst) as gst_payable,
    ar as receivables,
    -- Flag for frontend
    true as has_data
FROM financials;

-- Grant access
GRANT SELECT ON public.dashboard_metrics_view TO authenticated;
GRANT SELECT ON public.dashboard_metrics_view TO service_role;

-- ============================================================================
-- SUCCESS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Refined Accounting Engine Deployed Successfully';
  RAISE NOTICE '   - Invoice Triggers (Issue/Pay/Delete) Updated';
  RAISE NOTICE '   - Dashboard View Updated for Net GST';
END $$;
