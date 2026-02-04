-- ============================================================================
-- PART 1: AUTOMATIC INVOICE DELETION CLEANUP TRIGGER
-- ============================================================================
-- This ensures real-time data updates when invoices are deleted

CREATE OR REPLACE FUNCTION public.cleanup_invoice_financial_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete GST records associated with transactions for this invoice
  DELETE FROM public.gst_records
  WHERE transaction_id IN (
    SELECT id FROM public.transactions
    WHERE source_type = 'invoice' AND source_id = OLD.id
  );

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
-- PART 2: DASHBOARD METRICS VIEW
-- ============================================================================
-- Single source of truth for all dashboard financial calculations

CREATE OR REPLACE VIEW public.dashboard_metrics_view WITH (security_invoker = on) AS
WITH 
-- Income Statement Metrics
income_statement AS (
  SELECT 
    business_id,
    -- Revenue (Sales + Other Income)
    SUM(CASE 
      WHEN account_name IN ('Sales', 'Other Income', 'Interest Income') 
      THEN credit - debit 
      ELSE 0 
    END) AS total_revenue,
    
    -- Cost of Goods Sold
    SUM(CASE 
      WHEN account_name = 'Cost of Goods Sold' 
      THEN credit - debit 
      ELSE 0 
    END) AS cogs,
    
    -- Operating Expenses (all expenses except COGS)
    SUM(CASE 
      WHEN account_name NOT IN ('Sales', 'Other Income', 'Interest Income', 'Cost of Goods Sold',
                                 'Accounts Receivable', 'Bank', 'Cash', 'Inventory', 
                                 'Accounts Payable', 'GST Payable', 'Output CGST', 'Output SGST', 'Output IGST',
                                 'Input CGST', 'Input SGST', 'Input IGST',
                                 'Capital', 'Retained Earnings', 'Opening Balance Equity')
      THEN credit - debit 
      ELSE 0 
    END) AS operating_expenses
  FROM public.ledger_entries
  GROUP BY business_id
),

-- Balance Sheet Metrics
balance_sheet AS (
  SELECT 
    business_id,
    -- Assets
    SUM(CASE WHEN account_name = 'Accounts Receivable' THEN debit - credit ELSE 0 END) AS accounts_receivable,
    SUM(CASE WHEN account_name = 'Bank' THEN debit - credit ELSE 0 END) AS bank_balance,
    SUM(CASE WHEN account_name = 'Cash' THEN debit - credit ELSE 0 END) AS cash_balance,
    SUM(CASE WHEN account_name = 'Inventory' THEN debit - credit ELSE 0 END) AS inventory_value,
    
    -- Liabilities
    SUM(CASE WHEN account_name = 'Accounts Payable' THEN credit - debit ELSE 0 END) AS accounts_payable,
    SUM(CASE WHEN account_name IN ('Output CGST', 'Output SGST', 'Output IGST') THEN credit - debit ELSE 0 END) AS gst_output,
    SUM(CASE WHEN account_name IN ('Input CGST', 'Input SGST', 'Input IGST') THEN debit - credit ELSE 0 END) AS gst_input
  FROM public.ledger_entries
  GROUP BY business_id
)

SELECT 
  COALESCE(i.business_id, b.business_id) AS business_id,
  
  -- Income Statement KPIs
  COALESCE(i.total_revenue, 0) AS total_revenue,
  COALESCE(i.cogs, 0) AS cogs,
  COALESCE(i.operating_expenses, 0) AS operating_expenses,
  COALESCE(i.total_revenue, 0) + COALESCE(i.cogs, 0) + COALESCE(i.operating_expenses, 0) AS net_profit,
  
  -- Gross Profit (Revenue - COGS)
  COALESCE(i.total_revenue, 0) + COALESCE(i.cogs, 0) AS gross_profit,
  
  -- Balance Sheet KPIs
  COALESCE(b.accounts_receivable, 0) AS accounts_receivable,
  COALESCE(b.bank_balance, 0) AS bank_balance,
  COALESCE(b.cash_balance, 0) AS cash_balance,
  COALESCE(b.inventory_value, 0) AS inventory_value,
  COALESCE(b.accounts_payable, 0) AS accounts_payable,
  
  -- GST KPIs
  COALESCE(b.gst_output, 0) AS gst_output,
  COALESCE(b.gst_input, 0) AS gst_input,
  COALESCE(b.gst_output, 0) - COALESCE(b.gst_input, 0) AS gst_payable,
  
  -- Cash Flow (simplified)
  COALESCE(b.bank_balance, 0) + COALESCE(b.cash_balance, 0) AS total_cash

FROM income_statement i
FULL OUTER JOIN balance_sheet b ON i.business_id = b.business_id;

-- ============================================================================
-- DONE! You should see "Success. No rows returned" message
-- ============================================================================
