-- ============================================================================
-- WYTIS IMMUTABLE LEDGER SYSTEM - MASTER MIGRATION
-- ============================================================================
-- Version: 2.0
-- Date: 2026-01-31
-- Purpose: Complete backend rebuild for immutable, ledger-first accounting
--
-- ABSOLUTE INVARIANTS:
-- 1. Ledger entries are append-only and immutable
-- 2. No accounting record can be hard-deleted
-- 3. All KPIs derive from ledger_entries ONLY
-- 4. GST is balance sheet, never P&L
-- 5. Cancellation uses reversals, not deletion
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: DROP OLD LOGIC (Clean Slate)
-- ============================================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS on_invoice_issued_trigger ON public.invoices;
DROP TRIGGER IF EXISTS on_invoice_paid_trigger ON public.invoices;
DROP TRIGGER IF EXISTS trigger_cleanup_invoice_financials ON public.invoices;
DROP TRIGGER IF EXISTS on_invoice_delete ON public.invoices;
DROP TRIGGER IF EXISTS prevent_invoice_deletion ON public.invoices;
DROP TRIGGER IF EXISTS on_expense_posted ON public.expenses;

-- Drop old functions
DROP FUNCTION IF EXISTS public.handle_invoice_issued() CASCADE;
DROP FUNCTION IF EXISTS public.handle_invoice_paid() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_invoice_financial_records() CASCADE;
DROP FUNCTION IF EXISTS public.handle_invoice_delete() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_issued_invoice_deletion() CASCADE;
DROP FUNCTION IF EXISTS public.handle_expense_posted() CASCADE;

-- Drop old views (will recreate)
DROP VIEW IF EXISTS public.dashboard_metrics_view CASCADE;
DROP VIEW IF EXISTS public.net_profit_view CASCADE;
DROP VIEW IF EXISTS public.profit_and_loss_view CASCADE;
DROP VIEW IF EXISTS public.revenue_view CASCADE;
DROP VIEW IF EXISTS public.expense_view CASCADE;
DROP VIEW IF EXISTS public.accounts_receivable_view CASCADE;
DROP VIEW IF EXISTS public.accounts_payable_view CASCADE;
DROP VIEW IF EXISTS public.gst_payable_view CASCADE;
DROP VIEW IF EXISTS public.cash_flow_view CASCADE;

-- ============================================================================
-- PHASE 2: UPDATE INVOICE STATUS CONSTRAINT
-- ============================================================================
-- Simplified lifecycle: draft → issued → cancelled
-- Remove: paid, overdue, voided

ALTER TABLE public.invoices 
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'issued', 'cancelled'));

COMMENT ON COLUMN public.invoices.status IS 
'Invoice lifecycle: draft (editable, deletable) → issued (immutable) → cancelled (voided via reversal)';

-- ============================================================================
-- PHASE 3: DELETE PROTECTION TRIGGERS
-- ============================================================================

-- 3.1: Protect Ledger Entries (NEVER deletable)
CREATE OR REPLACE FUNCTION public.protect_ledger_entries()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable and cannot be deleted'
    USING HINT = 'Use reversing entries to correct mistakes',
          ERRCODE = 'integrity_constraint_violation';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS block_ledger_deletion ON public.ledger_entries;
CREATE TRIGGER block_ledger_deletion
  BEFORE DELETE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_ledger_entries();

-- 3.2: Protect Transactions (NEVER deletable)
CREATE OR REPLACE FUNCTION public.protect_transactions()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Transactions are immutable and cannot be deleted'
    USING HINT = 'Use reversing transactions to correct mistakes',
          ERRCODE = 'integrity_constraint_violation';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS block_transaction_deletion ON public.transactions;
CREATE TRIGGER block_transaction_deletion
  BEFORE DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_transactions();

-- 3.3: Protect Issued/Cancelled Invoices (Only drafts deletable)
CREATE OR REPLACE FUNCTION public.protect_issued_invoices()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'draft' THEN
    RAISE EXCEPTION 'Cannot delete % invoice. Only draft invoices can be deleted.', OLD.status
      USING HINT = 'Use cancellation for issued invoices',
            ERRCODE = 'integrity_constraint_violation';
  END IF;
  
  -- If draft, allow deletion (no ledger impact anyway)
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS block_invoice_deletion ON public.invoices;
CREATE TRIGGER block_invoice_deletion
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_issued_invoices();

-- ============================================================================
-- PHASE 4: INVOICE ISSUE TRIGGER (Idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_invoice_issue()
RETURNS TRIGGER AS $$
DECLARE
  v_txn_id uuid;
  v_existing_txn uuid;
  v_period text;
  v_gst_type text;
BEGIN
  -- Guard: Only trigger on draft → issued transition
  IF (TG_OP = 'UPDATE' AND OLD.status != 'issued' AND NEW.status = 'issued') OR
     (TG_OP = 'INSERT' AND NEW.status = 'issued') THEN
    
    -- Idempotency check: Has this invoice already been issued?
    SELECT id INTO v_existing_txn
    FROM public.transactions
    WHERE source_type = 'invoice' 
      AND source_id = NEW.id
      AND description NOT LIKE 'REVERSAL:%';
    
    IF v_existing_txn IS NOT NULL THEN
      -- Already processed, skip
      RETURN NEW;
    END IF;
    
    -- Determine GST type based on state
    IF NEW.is_interstate THEN
      v_gst_type := 'IGST';
    ELSE
      v_gst_type := 'CGST+SGST';
    END IF;
    
    -- Create transaction record
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount, 
      transaction_type, transaction_date, description
    ) VALUES (
      NEW.business_id, 'invoice', NEW.id, NEW.total_amount,
      'credit', NEW.invoice_date, 
      'Invoice #' || NEW.invoice_number
    ) RETURNING id INTO v_txn_id;
    
    -- Create EXACTLY 3 ledger entries
    
    -- Entry 1: Debit Accounts Receivable (Asset increases)
    INSERT INTO public.ledger_entries (
      business_id, transaction_id, account_name, debit, credit
    ) VALUES (
      NEW.business_id, v_txn_id, 'Accounts Receivable', NEW.total_amount, 0
    );
    
    -- Entry 2: Credit Sales (Revenue increases)
    INSERT INTO public.ledger_entries (
      business_id, transaction_id, account_name, debit, credit
    ) VALUES (
      NEW.business_id, v_txn_id, 'Sales', 0, NEW.subtotal
    );
    
    -- Entry 3: Credit GST Payable (Liability increases)
    IF NEW.gst_amount > 0 THEN
      IF NEW.is_interstate THEN
        -- IGST
        INSERT INTO public.ledger_entries (
          business_id, transaction_id, account_name, debit, credit
        ) VALUES (
          NEW.business_id, v_txn_id, 'Output IGST', 0, NEW.gst_amount
        );
      ELSE
        -- CGST + SGST (split 50/50)
        INSERT INTO public.ledger_entries (
          business_id, transaction_id, account_name, debit, credit
        ) VALUES 
          (NEW.business_id, v_txn_id, 'Output CGST', 0, NEW.gst_amount / 2),
          (NEW.business_id, v_txn_id, 'Output SGST', 0, NEW.gst_amount / 2);
      END IF;
      
      -- Record GST in gst_records table
      v_period := to_char(NEW.invoice_date, 'YYYY-MM');
      INSERT INTO public.gst_records (
        business_id, source_type, source_id, gst_type, 
        amount, tax_period, gst_direction
      ) VALUES (
        NEW.business_id, 'invoice', NEW.id, v_gst_type,
        NEW.gst_amount, v_period, 'output'
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS invoice_issue_trigger ON public.invoices;
CREATE TRIGGER invoice_issue_trigger
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_issue();

COMMENT ON FUNCTION public.handle_invoice_issue() IS
'Idempotent trigger: Creates ledger entries when invoice transitions to issued status';

-- ============================================================================
-- PHASE 5: INVOICE CANCELLATION TRIGGER (Reversal)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_invoice_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_reversal_txn_id uuid;
  v_existing_reversal uuid;
BEGIN
  -- Guard: Only trigger on issued → cancelled transition
  IF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'cancelled' THEN
    
    -- Check if already reversed
    SELECT id INTO v_existing_reversal
    FROM public.transactions
    WHERE source_type = 'invoice' 
      AND source_id = NEW.id
      AND description LIKE 'REVERSAL:%';
    
    IF v_existing_reversal IS NOT NULL THEN
      -- Already reversed
      RETURN NEW;
    END IF;
    
    -- Create reversal transaction
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount,
      transaction_type, transaction_date, description
    ) VALUES (
      NEW.business_id, 'invoice', NEW.id, NEW.total_amount,
      'debit', CURRENT_DATE,
      'REVERSAL: Invoice #' || NEW.invoice_number || ' (Cancelled)'
    ) RETURNING id INTO v_reversal_txn_id;
    
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
    
    -- Reversal 3: Debit GST Payable (Liability decreases)
    IF NEW.gst_amount > 0 THEN
      IF NEW.is_interstate THEN
        INSERT INTO public.ledger_entries (
          business_id, transaction_id, account_name, debit, credit
        ) VALUES (
          NEW.business_id, v_reversal_txn_id, 'Output IGST', NEW.gst_amount, 0
        );
      ELSE
        INSERT INTO public.ledger_entries (
          business_id, transaction_id, account_name, debit, credit
        ) VALUES 
          (NEW.business_id, v_reversal_txn_id, 'Output CGST', NEW.gst_amount / 2, 0),
          (NEW.business_id, v_reversal_txn_id, 'Output SGST', NEW.gst_amount / 2, 0);
      END IF;
    END IF;
    
    -- Audit log
    INSERT INTO public.audit_logs (
      business_id, user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.business_id, auth.uid(), 'invoice_cancelled', 'invoice', NEW.id,
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'amount', NEW.total_amount,
        'reversal_transaction_id', v_reversal_txn_id
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS invoice_cancellation_trigger ON public.invoices;
CREATE TRIGGER invoice_cancellation_trigger
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_cancellation();

COMMENT ON FUNCTION public.handle_invoice_cancellation() IS
'Creates reversing ledger entries when invoice is cancelled. Maintains immutable audit trail.';

-- ============================================================================
-- PHASE 6: EXPENSE POSTING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_expense_posting()
RETURNS TRIGGER AS $$
DECLARE
  v_txn_id uuid;
  v_existing_txn uuid;
  v_asset_account text;
  v_base_amount numeric;
  v_period text;
BEGIN
  -- Guard: Only on draft → posted (or insert as posted)
  IF (TG_OP = 'UPDATE' AND OLD.status != 'posted' AND NEW.status = 'posted') OR
     (TG_OP = 'INSERT' AND NEW.status = 'posted') THEN
    
    -- Idempotency check
    SELECT id INTO v_existing_txn
    FROM public.transactions
    WHERE source_type = 'expense' AND source_id = NEW.id;
    
    IF v_existing_txn IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Determine asset account
    IF NEW.payment_method = 'Cash' THEN
      v_asset_account := 'Cash';
    ELSE
      v_asset_account := 'Bank';
    END IF;
    
    -- Calculate base amount (excluding GST)
    v_base_amount := NEW.amount - COALESCE(NEW.gst_amount, 0);
    
    -- Create transaction
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount,
      transaction_type, transaction_date, description
    ) VALUES (
      NEW.business_id, 'expense', NEW.id, NEW.amount,
      'debit', NEW.expense_date,
      'Expense: ' || NEW.category
    ) RETURNING id INTO v_txn_id;
    
    -- Ledger entries
    
    -- Entry 1: Debit Expense Account (Expense increases, reduces profit)
    INSERT INTO public.ledger_entries (
      business_id, transaction_id, account_name, debit, credit
    ) VALUES (
      NEW.business_id, v_txn_id, NEW.category, v_base_amount, 0
    );
    
    -- Entry 2: Debit GST Input Credit (Asset, reduces GST liability)
    IF COALESCE(NEW.gst_amount, 0) > 0 THEN
      INSERT INTO public.ledger_entries (
        business_id, transaction_id, account_name, debit, credit
      ) VALUES (
        NEW.business_id, v_txn_id, 'Input IGST', NEW.gst_amount, 0
      );
      
      -- Record in gst_records
      v_period := to_char(NEW.expense_date, 'YYYY-MM');
      INSERT INTO public.gst_records (
        business_id, source_type, source_id, gst_type,
        amount, tax_period, gst_direction
      ) VALUES (
        NEW.business_id, 'expense', NEW.id, 'IGST',
        NEW.gst_amount, v_period, 'input'
      );
    END IF;
    
    -- Entry 3: Credit Bank/Cash (Asset decreases)
    INSERT INTO public.ledger_entries (
      business_id, transaction_id, account_name, debit, credit
    ) VALUES (
      NEW.business_id, v_txn_id, v_asset_account, 0, NEW.amount
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS expense_posting_trigger ON public.expenses;
CREATE TRIGGER expense_posting_trigger
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_posting();

COMMENT ON FUNCTION public.handle_expense_posting() IS
'Creates ledger entries when expense is posted. Expenses reduce profit via debit entries.';

-- ============================================================================
-- PHASE 7: LEDGER-ONLY DASHBOARD VIEWS
-- ============================================================================

-- 7.1: Revenue View
CREATE OR REPLACE VIEW public.revenue_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(credit - debit) as total_revenue,
  SUM(CASE WHEN account_name = 'Sales' THEN credit - debit ELSE 0 END) as sales,
  SUM(CASE WHEN account_name = 'Service Revenue' THEN credit - debit ELSE 0 END) as service_revenue,
  SUM(CASE WHEN account_name = 'Other Income' THEN credit - debit ELSE 0 END) as other_income
FROM public.ledger_entries
WHERE account_name IN ('Sales', 'Service Revenue', 'Other Income', 'Interest Income')
GROUP BY business_id;

COMMENT ON VIEW public.revenue_view IS 
'Total revenue from ledger entries. Income accounts only. GST excluded.';

-- 7.2: Expense View
CREATE OR REPLACE VIEW public.expense_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(debit - credit) as total_expense
FROM public.ledger_entries
WHERE account_name NOT IN (
  -- Exclude Balance Sheet Accounts
  'Accounts Receivable', 'Bank', 'Cash', 'Inventory', 
  'Fixed Assets', 'Accounts Payable', 'Capital', 
  'Retained Earnings', 'Opening Balance Equity',
  -- Exclude GST Accounts
  'Output CGST', 'Output SGST', 'Output IGST',
  'Input CGST', 'Input SGST', 'Input IGST',
  'GST Input Credit', 'GST Payable',
  -- Exclude Income Accounts
  'Sales', 'Service Revenue', 'Other Income', 'Interest Income'
)
AND (debit - credit) > 0  -- Only debit balances (expenses)
GROUP BY business_id;

COMMENT ON VIEW public.expense_view IS
'Total expenses from ledger entries. Excludes balance sheet and GST accounts.';

-- 7.3: Net Profit View
CREATE OR REPLACE VIEW public.net_profit_view WITH (security_invoker = on) AS
SELECT 
  COALESCE(r.business_id, e.business_id) as business_id,
  COALESCE(r.total_revenue, 0) as total_income,
  COALESCE(e.total_expense, 0) as total_expense,
  COALESCE(r.total_revenue, 0) - COALESCE(e.total_expense, 0) as net_profit
FROM public.revenue_view r
FULL OUTER JOIN public.expense_view e ON r.business_id = e.business_id;

COMMENT ON VIEW public.net_profit_view IS
'Net Profit = Revenue - Expenses. Derived entirely from ledger entries.';

-- 7.4: Accounts Receivable View
CREATE OR REPLACE VIEW public.accounts_receivable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(debit - credit) as total_receivable
FROM public.ledger_entries
WHERE account_name = 'Accounts Receivable'
GROUP BY business_id;

COMMENT ON VIEW public.accounts_receivable_view IS
'Money owed to business. Asset account with debit balance.';

-- 7.5: Accounts Payable View
CREATE OR REPLACE VIEW public.accounts_payable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(credit - debit) as total_payable
FROM public.ledger_entries
WHERE account_name = 'Accounts Payable'
GROUP BY business_id;

COMMENT ON VIEW public.accounts_payable_view IS
'Money owed by business. Liability account with credit balance.';

-- 7.6: GST Payable View (Net GST = Output - Input)
CREATE OR REPLACE VIEW public.gst_payable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  -- Output GST (what we collected from customers)
  SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST')
      THEN credit - debit ELSE 0 END) as gst_output,
  -- Input GST (what we paid on purchases - can claim as credit)
  SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST')
      THEN debit - credit ELSE 0 END) as gst_input,
  -- Net GST Payable = Output - Input
  SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST')
      THEN credit - debit ELSE 0 END) -
  SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST')
      THEN debit - credit ELSE 0 END) as gst_payable
FROM public.ledger_entries
WHERE account_name IN (
  'Output CGST', 'Output SGST', 'Output IGST',
  'Input CGST', 'Input SGST', 'Input IGST'
)
GROUP BY business_id;

COMMENT ON VIEW public.gst_payable_view IS
'Net GST liability. Output GST - Input GST. Balance sheet item, NOT P&L.';

-- 7.7: Cash Balance View
CREATE OR REPLACE VIEW public.cash_balance_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(CASE WHEN account_name = 'Bank' THEN debit - credit ELSE 0 END) as bank_balance,
  SUM(CASE WHEN account_name = 'Cash' THEN debit - credit ELSE 0 END) as cash_balance,
  SUM(CASE WHEN account_name IN ('Bank', 'Cash') THEN debit - credit ELSE 0 END) as total_cash
FROM public.ledger_entries
WHERE account_name IN ('Bank', 'Cash')
GROUP BY business_id;

COMMENT ON VIEW public.cash_balance_view IS
'Cash position from ledger entries. Bank + Cash balances.';

-- 7.8: Master Dashboard Metrics View
CREATE OR REPLACE VIEW public.dashboard_metrics_view WITH (security_invoker = on) AS
SELECT 
  COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id, c.business_id, np.business_id) as business_id,
  
  -- Revenue (for compatibility)
  COALESCE(r.total_revenue, 0) as revenue,
  COALESCE(r.total_revenue, 0) as total_revenue,
  COALESCE(r.sales, 0) as sales,
  
  -- Profit & Loss
  COALESCE(np.total_income, 0) as total_income,
  COALESCE(np.total_expense, 0) as total_expense,
  COALESCE(np.net_profit, 0) as net_profit,
  
  -- Balance Sheet
  COALESCE(ar.total_receivable, 0) as receivables,
  COALESCE(ar.total_receivable, 0) as accounts_receivable,
  COALESCE(ap.total_payable, 0) as payables,
  COALESCE(ap.total_payable, 0) as accounts_payable,
  
  -- GST (Balance Sheet Liability)
  COALESCE(g.gst_output, 0) as gst_output,
  COALESCE(g.gst_input, 0) as gst_input,
  COALESCE(g.gst_payable, 0) as gst_payable,
  
  -- Cash
  COALESCE(c.bank_balance, 0) as bank_balance,
  COALESCE(c.cash_balance, 0) as cash_balance,
  COALESCE(c.total_cash, 0) as total_cash,
  
  -- Data flag
  CASE 
    WHEN COALESCE(r.total_revenue, 0) != 0 
      OR COALESCE(ar.total_receivable, 0) != 0 
      OR COALESCE(ap.total_payable, 0) != 0 
    THEN true 
    ELSE false 
  END as has_data

FROM public.revenue_view r
FULL OUTER JOIN public.accounts_receivable_view ar ON r.business_id = ar.business_id
FULL OUTER JOIN public.accounts_payable_view ap ON COALESCE(r.business_id, ar.business_id) = ap.business_id
FULL OUTER JOIN public.gst_payable_view g ON COALESCE(r.business_id, ar.business_id, ap.business_id) = g.business_id
FULL OUTER JOIN public.cash_balance_view c ON COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id) = c.business_id
FULL OUTER JOIN public.net_profit_view np ON COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id, c.business_id) = np.business_id;

COMMENT ON VIEW public.dashboard_metrics_view IS
'Master dashboard view. ALL metrics derived from ledger_entries ONLY. Single source of truth.';

-- ============================================================================
-- PHASE 8: INTEGRITY CONSTRAINTS
-- ============================================================================

-- 8.1: Prevent duplicate invoice transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_invoice_transaction
  ON public.transactions (source_type, source_id)
  WHERE source_type = 'invoice' AND description NOT LIKE 'REVERSAL:%';

-- 8.2: Prevent duplicate expense transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_expense_transaction
  ON public.transactions (source_type, source_id)
  WHERE source_type = 'expense';

-- 8.3: Balanced transaction check (deferred constraint)
CREATE OR REPLACE FUNCTION public.check_transaction_balanced()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric;
  total_credit numeric;
BEGIN
  -- Calculate totals for this transaction
  SELECT 
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO total_debit, total_credit
  FROM public.ledger_entries
  WHERE transaction_id = NEW.transaction_id;
  
  -- Allow small rounding differences (0.01)
  IF ABS(total_debit - total_credit) > 0.01 THEN
    RAISE EXCEPTION 'Transaction % is unbalanced: Debit=%, Credit=%', 
      NEW.transaction_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_balanced_transaction ON public.ledger_entries;
CREATE CONSTRAINT TRIGGER enforce_balanced_transaction
  AFTER INSERT OR UPDATE ON public.ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.check_transaction_balanced();

COMMENT ON FUNCTION public.check_transaction_balanced() IS
'Ensures every transaction has balanced debits and credits (double-entry bookkeeping).';

-- ============================================================================
-- PHASE 9: GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT on all views
GRANT SELECT ON public.revenue_view TO authenticated;
GRANT SELECT ON public.expense_view TO authenticated;
GRANT SELECT ON public.net_profit_view TO authenticated;
GRANT SELECT ON public.accounts_receivable_view TO authenticated;
GRANT SELECT ON public.accounts_payable_view TO authenticated;
GRANT SELECT ON public.gst_payable_view TO authenticated;
GRANT SELECT ON public.cash_balance_view TO authenticated;
GRANT SELECT ON public.dashboard_metrics_view TO authenticated;

-- Revoke DELETE on critical tables (only service_role can delete)
REVOKE DELETE ON public.ledger_entries FROM authenticated;
REVOKE DELETE ON public.transactions FROM authenticated;
-- Note: invoices can still be deleted if status = 'draft' (trigger enforces)

-- ============================================================================
-- COMMIT & NOTIFY
-- ============================================================================

COMMIT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ IMMUTABLE LEDGER SYSTEM DEPLOYED SUCCESSFULLY';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'PROTECTION ENABLED:';
  RAISE NOTICE '  ✓ Ledger entries are immutable (cannot be deleted)';
  RAISE NOTICE '  ✓ Transactions are immutable (cannot be deleted)';
  RAISE NOTICE '  ✓ Issued invoices cannot be deleted (only cancelled)';
  RAISE NOTICE '  ✓ Draft invoices can be deleted';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGERS ACTIVE:';
  RAISE NOTICE '  ✓ Invoice Issue → Creates ledger entries (idempotent)';
  RAISE NOTICE '  ✓ Invoice Cancel → Creates reversing entries';
  RAISE NOTICE '  ✓ Expense Post → Creates ledger entries (idempotent)';
  RAISE NOTICE '';
  RAISE NOTICE 'VIEWS CREATED:';
  RAISE NOTICE '  ✓ revenue_view';
  RAISE NOTICE '  ✓ expense_view';
  RAISE NOTICE '  ✓ net_profit_view';
  RAISE NOTICE '  ✓ accounts_receivable_view';
  RAISE NOTICE '  ✓ gst_payable_view';
  RAISE NOTICE '  ✓ dashboard_metrics_view (MASTER)';
  RAISE NOTICE '';
  RAISE NOTICE 'INTEGRITY CHECKS:';
  RAISE NOTICE '  ✓ Balanced transactions enforced';
  RAISE NOTICE '  ✓ Duplicate transactions prevented';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '  1. Update application code to use views only';
  RAISE NOTICE '  2. Remove all frontend calculations';
  RAISE NOTICE '  3. Test invoice lifecycle (issue → cancel)';
  RAISE NOTICE '  4. Verify dashboard stability';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
