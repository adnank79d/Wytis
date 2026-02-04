-- ============================================================================
-- COMPREHENSIVE FINANCIAL VIEWS
-- ============================================================================
-- All dashboard KPIs must be derived EXCLUSIVELY from ledger_entries
-- Following strict double-entry bookkeeping principles
-- GST is NEVER included in P&L (it's a liability account)
-- ============================================================================

-- ============================================================================
-- 1. REVENUE VIEW
-- ============================================================================
-- Total revenue from income accounts only
-- Excludes GST (which is a liability, not revenue)

CREATE OR REPLACE VIEW public.revenue_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(credit - debit) as total_revenue,
  -- Breakdown by account
  SUM(CASE WHEN account_name = 'Sales' THEN credit - debit ELSE 0 END) as sales,
  SUM(CASE WHEN account_name = 'Other Income' THEN credit - debit ELSE 0 END) as other_income,
  SUM(CASE WHEN account_name = 'Interest Income' THEN credit - debit ELSE 0 END) as interest_income
FROM public.ledger_entries
WHERE account_name IN ('Sales', 'Other Income', 'Interest Income')
GROUP BY business_id;

COMMENT ON VIEW public.revenue_view IS 
'Total revenue from ledger_entries. Excludes GST. Single source of truth for revenue KPIs.';

-- ============================================================================
-- 2. ACCOUNTS RECEIVABLE VIEW
-- ============================================================================
-- Money owed to the business (Asset account - Debit balance)

CREATE OR REPLACE VIEW public.accounts_receivable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(debit - credit) as total_receivable
FROM public.ledger_entries
WHERE account_name = 'Accounts Receivable'
GROUP BY business_id;

COMMENT ON VIEW public.accounts_receivable_view IS 
'Total accounts receivable from ledger_entries. Asset account with debit balance.';

-- ============================================================================
-- 3. ACCOUNTS PAYABLE VIEW
-- ============================================================================
-- Money owed by the business (Liability account - Credit balance)

CREATE OR REPLACE VIEW public.accounts_payable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(credit - debit) as total_payable
FROM public.ledger_entries
WHERE account_name = 'Accounts Payable'
GROUP BY business_id;

COMMENT ON VIEW public.accounts_payable_view IS 
'Total accounts payable from ledger_entries. Liability account with credit balance.';

-- ============================================================================
-- 4. GST PAYABLE VIEW
-- ============================================================================
-- Net GST liability (Output GST - Input GST)
-- GST is a LIABILITY account, NOT part of P&L

CREATE OR REPLACE VIEW public.gst_payable_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  -- Output GST (liability - credit balance)
  SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST') 
      THEN credit - debit ELSE 0 END) as gst_output,
  -- Input GST (asset - debit balance, represents credit we can claim)
  SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST') 
      THEN debit - credit ELSE 0 END) as gst_input,
  -- Net GST Payable = Output - Input
  SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST') 
      THEN credit - debit ELSE 0 END) -
  SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST') 
      THEN debit - credit ELSE 0 END) as gst_payable
FROM public.ledger_entries
WHERE account_name IN ('Output CGST', 'Output SGST', 'Output IGST', 
                       'Input CGST', 'Input SGST', 'Input IGST')
GROUP BY business_id;

COMMENT ON VIEW public.gst_payable_view IS 
'GST liability from ledger_entries. Output GST - Input GST. NOT included in P&L.';

-- ============================================================================
-- 5. NET CASH FLOW VIEW
-- ============================================================================
-- Total cash position (Bank + Cash accounts)

CREATE OR REPLACE VIEW public.cash_flow_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(CASE WHEN account_name = 'Bank' THEN debit - credit ELSE 0 END) as bank_balance,
  SUM(CASE WHEN account_name = 'Cash' THEN debit - credit ELSE 0 END) as cash_balance,
  SUM(CASE WHEN account_name IN ('Bank', 'Cash') THEN debit - credit ELSE 0 END) as net_cash
FROM public.ledger_entries
WHERE account_name IN ('Bank', 'Cash')
GROUP BY business_id;

COMMENT ON VIEW public.cash_flow_view IS 
'Cash position from ledger_entries. Bank + Cash balances.';

-- ============================================================================
-- 6. PROFIT & LOSS VIEW (FIXED)
-- ============================================================================
-- Income Statement accounts ONLY
-- EXCLUDES: Balance Sheet accounts AND GST accounts

CREATE OR REPLACE VIEW public.profit_and_loss_view WITH (security_invoker = on) AS
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
  -- Balance Sheet Accounts (Assets & Liabilities)
  'Accounts Receivable', 
  'Bank', 
  'Cash', 
  'Inventory',
  'Accounts Payable', 
  'Capital', 
  'Retained Earnings',
  'Opening Balance Equity',
  -- GST Accounts (Liabilities - NOT in P&L!)
  'Output CGST', 
  'Output SGST', 
  'Output IGST',
  'Input CGST', 
  'Input SGST', 
  'Input IGST',
  'GST Payable'
)
GROUP BY business_id, account_name;

COMMENT ON VIEW public.profit_and_loss_view IS 
'Income statement from ledger_entries. Excludes balance sheet AND GST accounts.';

-- ============================================================================
-- 7. NET PROFIT VIEW
-- ============================================================================
-- Simplified net profit calculation from P&L

CREATE OR REPLACE VIEW public.net_profit_view WITH (security_invoker = on) AS
SELECT 
  business_id,
  SUM(CASE WHEN category = 'Income' THEN net_amount ELSE 0 END) as total_income,
  SUM(CASE WHEN category = 'Expense' THEN net_amount ELSE 0 END) as total_expense,
  SUM(net_amount) as net_profit
FROM public.profit_and_loss_view
GROUP BY business_id;

COMMENT ON VIEW public.net_profit_view IS 
'Net profit from P&L view. Income + Expenses (expenses are negative).';

-- ============================================================================
-- 8. COMPREHENSIVE DASHBOARD METRICS VIEW
-- ============================================================================
-- Single view combining all KPIs for dashboard

CREATE OR REPLACE VIEW public.dashboard_metrics_view WITH (security_invoker = on) AS
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

COMMENT ON VIEW public.dashboard_metrics_view IS 
'Comprehensive dashboard KPIs. ALL metrics derived from ledger_entries. Single source of truth.';

-- ============================================================================
-- RELOAD SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DONE!
-- ============================================================================
-- All dashboard KPIs now come exclusively from ledger_entries
-- GST is properly excluded from P&L
-- Frontend must query ONLY these views
-- ============================================================================
