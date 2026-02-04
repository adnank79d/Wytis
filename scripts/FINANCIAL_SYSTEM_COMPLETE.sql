-- ============================================================================
-- WYTIS FINANCIAL SYSTEM - COMPLETE SQL SETUP (FIXED v2)
-- ============================================================================
-- Fixed: gst_records cleanup uses invoice_id (not transaction_id)
-- Apply this ONCE in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING VIEWS (if they exist)
-- ============================================================================

DROP VIEW IF EXISTS public.dashboard_metrics_view CASCADE;
DROP VIEW IF EXISTS public.net_profit_view CASCADE;
DROP VIEW IF EXISTS public.profit_and_loss_view CASCADE;
DROP VIEW IF EXISTS public.cash_flow_view CASCADE;
DROP VIEW IF EXISTS public.gst_payable_view CASCADE;
DROP VIEW IF EXISTS public.accounts_payable_view CASCADE;
DROP VIEW IF EXISTS public.accounts_receivable_view CASCADE;
DROP VIEW IF EXISTS public.revenue_view CASCADE;

-- ============================================================================
-- STEP 2: AUTOMATIC INVOICE DELETION CLEANUP TRIGGER (FIXED)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_invoice_financial_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete GST records (uses invoice_id, not transaction_id!)
  DELETE FROM public.gst_records
  WHERE invoice_id = OLD.id;

  -- Delete ledger entries associated with transactions for this invoice
  DELETE FROM public.ledger_entries
  WHERE transaction_id IN (
    SELECT id FROM public.transactions
    WHERE source_type = 'invoice' AND source_id = OLD.id
  );

  -- Delete transactions for this invoice
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
-- STEP 3: FINANCIAL VIEWS (Single Source of Truth)
-- ============================================================================

-- 1. REVENUE VIEW
CREATE VIEW public.revenue_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(credit - debit) as total_revenue,
  SUM(CASE WHEN account_name = 'Sales' THEN credit - debit ELSE 0 END) as sales,
  SUM(CASE WHEN account_name = 'Other Income' THEN credit - debit ELSE 0 END) as other_income,
  SUM(CASE WHEN account_name = 'Interest Income' THEN credit - debit ELSE 0 END) as interest_income
FROM public.ledger_entries
WHERE account_name IN ('Sales', 'Other Income', 'Interest Income')
GROUP BY business_id;

-- 2. ACCOUNTS RECEIVABLE VIEW
CREATE VIEW public.accounts_receivable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(debit - credit) as total_receivable
FROM public.ledger_entries
WHERE account_name = 'Accounts Receivable'
GROUP BY business_id;

-- 3. ACCOUNTS PAYABLE VIEW
CREATE VIEW public.accounts_payable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(credit - debit) as total_payable
FROM public.ledger_entries
WHERE account_name = 'Accounts Payable'
GROUP BY business_id;

-- 4. GST PAYABLE VIEW
CREATE VIEW public.gst_payable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST') 
      THEN credit - debit ELSE 0 END) as gst_output,
  SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST') 
      THEN debit - credit ELSE 0 END) as gst_input,
  SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST') 
      THEN credit - debit ELSE 0 END) -
  SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST') 
      THEN debit - credit ELSE 0 END) as gst_payable
FROM public.ledger_entries
WHERE account_name IN ('Output CGST', 'Output SGST', 'Output IGST', 
                       'Input CGST', 'Input SGST', 'Input IGST')
GROUP BY business_id;

-- 5. CASH FLOW VIEW
CREATE VIEW public.cash_flow_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(CASE WHEN account_name = 'Bank' THEN debit - credit ELSE 0 END) as bank_balance,
  SUM(CASE WHEN account_name = 'Cash' THEN debit - credit ELSE 0 END) as cash_balance,
  SUM(CASE WHEN account_name IN ('Bank', 'Cash') THEN debit - credit ELSE 0 END) as net_cash
FROM public.ledger_entries
WHERE account_name IN ('Bank', 'Cash')
GROUP BY business_id;

-- 6. PROFIT & LOSS VIEW (FIXED - Excludes GST!)
CREATE VIEW public.profit_and_loss_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  account_name,
  CASE 
    WHEN account_name IN ('Sales', 'Other Income', 'Interest Income') THEN 'Income'
    ELSE 'Expense'
  END as category,
  SUM(credit - debit) as net_amount
FROM public.ledger_entries
WHERE account_name NOT IN (
  -- Balance Sheet Accounts
  'Accounts Receivable', 'Bank', 'Cash', 'Inventory',
  'Accounts Payable', 'Capital', 'Retained Earnings', 'Opening Balance Equity',
  -- GST Accounts (NOT in P&L!)
  'Output CGST', 'Output SGST', 'Output IGST',
  'Input CGST', 'Input SGST', 'Input IGST', 'GST Payable'
)
GROUP BY business_id, account_name;

-- 7. NET PROFIT VIEW
CREATE VIEW public.net_profit_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(CASE WHEN category = 'Income' THEN net_amount ELSE 0 END) as total_income,
  SUM(CASE WHEN category = 'Expense' THEN net_amount ELSE 0 END) as total_expense,
  SUM(net_amount) as net_profit
FROM public.profit_and_loss_view
GROUP BY business_id;

-- 8. COMPREHENSIVE DASHBOARD METRICS VIEW
CREATE VIEW public.dashboard_metrics_view WITH (security_invoker = on) AS
SELECT 
  COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id, c.business_id, np.business_id) as business_id,
  
  -- Revenue
  COALESCE(r.total_revenue, 0) as total_revenue,
  COALESCE(r.sales, 0) as sales,
  COALESCE(r.other_income, 0) as other_income,
  
  -- Profit & Loss
  COALESCE(np.total_income, 0) as total_income,
  COALESCE(np.total_expense, 0) as total_expense,
  COALESCE(np.net_profit, 0) as net_profit,
  
  -- Balance Sheet
  COALESCE(ar.total_receivable, 0) as accounts_receivable,
  COALESCE(ap.total_payable, 0) as accounts_payable,
  
  -- GST
  COALESCE(g.gst_output, 0) as gst_output,
  COALESCE(g.gst_input, 0) as gst_input,
  COALESCE(g.gst_payable, 0) as gst_payable,
  
  -- Cash
  COALESCE(c.bank_balance, 0) as bank_balance,
  COALESCE(c.cash_balance, 0) as cash_balance,
  COALESCE(c.net_cash, 0) as net_cash

FROM public.revenue_view r
FULL OUTER JOIN public.accounts_receivable_view ar ON r.business_id = ar.business_id
FULL OUTER JOIN public.accounts_payable_view ap ON COALESCE(r.business_id, ar.business_id) = ap.business_id
FULL OUTER JOIN public.gst_payable_view g ON COALESCE(r.business_id, ar.business_id, ap.business_id) = g.business_id
FULL OUTER JOIN public.cash_flow_view c ON COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id) = c.business_id
FULL OUTER JOIN public.net_profit_view np ON COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id, c.business_id) = np.business_id;

-- ============================================================================
-- RELOAD SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DONE! You should see "Success. No rows returned"
-- ============================================================================
