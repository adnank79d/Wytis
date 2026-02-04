-- ============================================================================
-- FIX NET PROFIT CALCULATION
-- ============================================================================
-- Problem: P&L view doesn't capture dynamic expense accounts
-- Solution: Include ALL accounts except Balance Sheet and GST accounts
-- Net Profit = Revenue (Income accounts) - Expenses (all other P&L accounts)
-- ============================================================================

-- Drop and recreate the Profit & Loss view with correct logic
DROP VIEW IF EXISTS public.profit_and_loss_view CASCADE;

CREATE OR REPLACE VIEW public.profit_and_loss_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  account_name,
  CASE 
    -- Income accounts (Credit balance = positive income)
    WHEN account_name IN ('Sales', 'Other Income', 'Interest Income', 'Service Revenue') THEN 'Income'
    -- Everything else that's not Balance Sheet or GST is an Expense
    ELSE 'Expense'
  END as category,
  -- For Income: credit - debit (positive = income)
  -- For Expense: credit - debit (negative = expense, which reduces profit)
  SUM(credit - debit) as net_amount
FROM public.ledger_entries
WHERE account_name NOT IN (
  -- BALANCE SHEET ACCOUNTS (Assets)
  'Accounts Receivable', 
  'Bank', 
  'Cash', 
  'Inventory',
  'Fixed Assets',
  'Prepaid Expenses',
  
  -- BALANCE SHEET ACCOUNTS (Liabilities & Equity)
  'Accounts Payable', 
  'Capital', 
  'Retained Earnings',
  'Opening Balance Equity',
  'Drawings',
  
  -- GST ACCOUNTS (Liabilities/Assets - NOT in P&L!)
  'Output CGST', 
  'Output SGST', 
  'Output IGST',
  'Input CGST', 
  'Input SGST', 
  'Input IGST',
  'GST Input Credit',
  'GST Payable'
)
GROUP BY business_id, account_name;

COMMENT ON VIEW public.profit_and_loss_view IS 
'Income statement from ledger_entries. Includes ALL accounts except Balance Sheet and GST. Expense accounts have negative net_amount.';

-- ============================================================================
-- Recreate Net Profit View (depends on P&L view)
-- ============================================================================

DROP VIEW IF EXISTS public.net_profit_view CASCADE;

CREATE OR REPLACE VIEW public.net_profit_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  -- Total Income (positive values)
  SUM(CASE WHEN category = 'Income' THEN net_amount ELSE 0 END) as total_income,
  -- Total Expenses (will be negative, so we negate it for display)
  ABS(SUM(CASE WHEN category = 'Expense' THEN net_amount ELSE 0 END)) as total_expense,
  -- Net Profit = Income + Expenses (expenses are negative, so this is subtraction)
  SUM(net_amount) as net_profit
FROM public.profit_and_loss_view
GROUP BY business_id;

COMMENT ON VIEW public.net_profit_view IS 
'Net profit from P&L view. Net Profit = Sum of all P&L accounts (Income - Expenses).';

-- ============================================================================
-- Recreate Dashboard Metrics View (depends on net_profit_view)
-- ============================================================================

DROP VIEW IF EXISTS public.dashboard_metrics_view CASCADE;

CREATE OR REPLACE VIEW public.dashboard_metrics_view WITH (security_invoker = on) AS
SELECT 
  COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id, c.business_id, np.business_id) as business_id,
  
  -- Revenue (for compatibility, same as total_income)
  COALESCE(r.total_revenue, 0) as revenue,
  COALESCE(r.total_revenue, 0) as total_revenue,
  COALESCE(r.sales, 0) as sales,
  COALESCE(r.other_income, 0) as other_income,
  
  -- Profit & Loss
  COALESCE(np.total_income, 0) as total_income,
  COALESCE(np.total_expense, 0) as total_expense,
  COALESCE(np.net_profit, 0) as net_profit,
  
  -- Balance Sheet
  COALESCE(ar.total_receivable, 0) as ar,
  COALESCE(ar.total_receivable, 0) as receivables,
  COALESCE(ar.total_receivable, 0) as accounts_receivable,
  COALESCE(ap.total_payable, 0) as payables,
  COALESCE(ap.total_payable, 0) as accounts_payable,
  
  -- GST
  COALESCE(g.gst_output, 0) as gst_output,
  COALESCE(g.gst_input, 0) as gst_input,
  COALESCE(g.gst_payable, 0) as gst_payable,
  
  -- Cash
  COALESCE(c.bank_balance, 0) as bank_balance,
  COALESCE(c.cash_balance, 0) as cash_balance,
  COALESCE(c.net_cash, 0) as net_cash,
  
  -- Has data flag
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
FULL OUTER JOIN public.cash_flow_view c ON COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id) = c.business_id
FULL OUTER JOIN public.net_profit_view np ON COALESCE(r.business_id, ar.business_id, ap.business_id, g.business_id, c.business_id) = np.business_id;

COMMENT ON VIEW public.dashboard_metrics_view IS 
'Comprehensive dashboard KPIs. ALL metrics derived from ledger_entries. Net Profit = Revenue - Expenses.';

-- ============================================================================
-- RELOAD SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the fix:
-- SELECT business_id, revenue, total_expense, net_profit 
-- FROM dashboard_metrics_view 
-- WHERE business_id = '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd';
--
-- Expected: net_profit = revenue - total_expense
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Net Profit calculation fixed!';
  RAISE NOTICE '   Formula: Net Profit = Revenue - Expenses';
  RAISE NOTICE '   All values derived from ledger_entries only';
  RAISE NOTICE '   GST excluded from P&L';
END $$;
