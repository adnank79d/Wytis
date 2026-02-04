-- Update Profit and Loss View to find ALL expenses
-- Previously it only looked for a hardcoded list. Now it checks everything NOT in Balance Sheet.

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
    'Create Capital', -- Sometimes used in seeding
    'Retained Earnings',
    'Opening Balance Equity'
)
GROUP BY business_id, account_name;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
