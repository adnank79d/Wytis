-- Migration: 20240118000002_financial_views
-- Description: Read-only financial views derived from the ledger.
-- Security: All views use strict RLS via (security_invoker = on).

--------------------------------------------------------------------------------
-- 1. PROFIT_AND_LOSS_VIEW
--------------------------------------------------------------------------------
-- Derives Income (Credit balances) and Expenses (Debit balances).
-- Categorization is based on account name strings for this core model.
CREATE OR REPLACE VIEW public.profit_and_loss_view WITH (security_invoker = on) AS
SELECT
  business_id,
  account_name,
  CASE
    WHEN account_name IN ('Sales', 'Other Income', 'Interest Income') THEN 'Income'
    ELSE 'Expense' -- Default everything else (that isn't filtered out below) to Expense
  END as category,
  SUM(credit - debit) as net_amount -- Positive for Income, Negative for Expense
FROM public.ledger_entries
WHERE account_name NOT IN (
    -- Balance Sheet Accounts (Exclude from P&L)
    'Accounts Receivable', 
    'Bank', 
    'Cash', 
    'Inventory', 
    'Accounts Payable', 
    'GST Payable', 
    'Capital', 
    'Retained Earnings',
    'Opening Balance Equity'
)
GROUP BY business_id, account_name;

--------------------------------------------------------------------------------
-- 2. BALANCE_SHEET_VIEW
--------------------------------------------------------------------------------
-- Assets = Liabilities + Equity
-- This view summarizes the position of permanent accounts.
CREATE OR REPLACE VIEW public.balance_sheet_view WITH (security_invoker = on) AS
WITH account_balances AS (
    SELECT
        business_id,
        account_name,
        SUM(debit - credit) as balance -- Debit normal for Assets, Credit normal for Liab/Equity
    FROM public.ledger_entries
    GROUP BY business_id, account_name
),
classified_balances AS (
    SELECT
        business_id,
        account_name,
        balance,
        CASE
            WHEN account_name IN ('Accounts Receivable', 'Bank', 'Cash', 'Inventory') THEN 'Asset'
            WHEN account_name IN ('GST Payable', 'Accounts Payable') THEN 'Liability'
            WHEN account_name IN ('Capital', 'Retained Earnings') THEN 'Equity'
            ELSE 'Nominal' -- P&L items are 'Nominal' and flow into Equity via Retained Earnings calculation below
        END as type
    FROM account_balances
),
current_earnings AS (
    -- Calculate Net Profit (Income - Expense) to add to Equity linkage
    SELECT
        business_id,
        SUM(credit - debit) as amount
    FROM public.ledger_entries
    WHERE account_name IN ('Sales', 'Other Income', 'Cost of Goods Sold', 'Expense', 'Salaries', 'Rent')
    GROUP BY business_id
)
SELECT
    b.business_id,
    b.account_name,
    b.type,
    b.balance as amount
FROM classified_balances b
WHERE b.type IN ('Asset', 'Liability', 'Equity')
UNION ALL
-- Synthesize the "Current Earnings" line item into Equity
SELECT
    e.business_id,
    'Current Earnings' as account_name,
    'Equity' as type,
    -e.amount as amount -- Equity is Credit normal, so negative in simple (Debit-Credit) math?
                        -- Wait, standard convention:
                        -- Assets (Debit +)
                        -- Liab/Equity (Credit +)
                        -- Here `balance` is (Debit - Credit).
                        -- So Assets are Positive. Liab/Equity are Negative.
                        -- Current Earnings (Income - Expense) usually Credit+.
                        -- So (Credit - Debit) is Positive implies Profit.
                        -- In (Debit - Credit) terms, Profit is Negative (like Equity).
                        -- So we return `-e.amount` (which is -(Credit-Debit) = Debit-Credit).
                        -- Correct, this aligns with the Liability/Equity sign convention in this view.
FROM current_earnings e;

--------------------------------------------------------------------------------
-- 3. GST_SUMMARY_VIEW
--------------------------------------------------------------------------------
-- Summarizes GST liability by period.
CREATE OR REPLACE VIEW public.gst_summary_view WITH (security_invoker = on) AS
SELECT
  business_id,
  tax_period,
  gst_type,
  SUM(amount) as total_payable
FROM public.gst_records
GROUP BY business_id, tax_period, gst_type;

--------------------------------------------------------------------------------
-- 4. CUSTOMER_RECEIVABLES_VIEW
--------------------------------------------------------------------------------
-- Detailed Outstanding Receivables by Customer.
-- Derived strictly from Ledger and Invoices linkage.
CREATE OR REPLACE VIEW public.customer_receivables_view WITH (security_invoker = on) AS
SELECT
    l.business_id,
    i.id as invoice_id,
    i.invoice_number,
    i.customer_name,
    SUM(l.debit - l.credit) as outstanding_amount
FROM public.ledger_entries l
JOIN public.transactions t ON l.transaction_id = t.id
JOIN public.invoices i ON t.source_id = i.id
WHERE l.account_name = 'Accounts Receivable'
GROUP BY l.business_id, i.id, i.invoice_number, i.customer_name
HAVING SUM(l.debit - l.credit) > 0; -- Only show positive outstanding balances
