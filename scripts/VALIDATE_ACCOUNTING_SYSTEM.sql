-- ============================================================================
-- ACCOUNTING SYSTEM VALIDATION TESTS
-- ============================================================================
-- Run these queries to verify the immutable ledger system is working correctly
-- All tests must pass for the system to be considered valid
-- ============================================================================

-- ============================================================================
-- TEST 1: Ledger Balance Check
-- ============================================================================
-- Every transaction must have balanced debits and credits

SELECT 
  t.id as transaction_id,
  t.description,
  SUM(l.debit) as total_debit,
  SUM(l.credit) as total_credit,
  ABS(SUM(l.debit) - SUM(l.credit)) as imbalance
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
GROUP BY t.id, t.description
HAVING ABS(SUM(l.debit) - SUM(l.credit)) > 0.01
ORDER BY imbalance DESC;

-- Expected: NO ROWS (all transactions balanced)
-- If rows appear: CRITICAL ERROR - unbalanced transactions exist

-- ============================================================================
-- TEST 2: Dashboard Stability Check
-- ============================================================================
-- Dashboard values should be identical on repeated queries

SELECT 
  business_id,
  revenue,
  total_expense,
  net_profit,
  receivables,
  gst_payable
FROM dashboard_metrics_view;

-- Run this query 3 times
-- Expected: IDENTICAL results every time
-- If different: ERROR - dashboard is not stable

-- ============================================================================
-- TEST 3: Net Profit Formula Check
-- ============================================================================
-- Net Profit must equal Revenue - Expenses

SELECT 
  business_id,
  revenue,
  total_expense,
  net_profit,
  (revenue - total_expense) as calculated_profit,
  ABS(net_profit - (revenue - total_expense)) as difference
FROM dashboard_metrics_view
WHERE ABS(net_profit - (revenue - total_expense)) > 0.01;

-- Expected: NO ROWS (formula is correct)
-- If rows appear: ERROR - net profit calculation is wrong

-- ============================================================================
-- TEST 4: GST Not in P&L Check
-- ============================================================================
-- GST accounts should NEVER appear in expense calculations

SELECT 
  account_name,
  SUM(debit - credit) as balance
FROM ledger_entries
WHERE account_name IN (
  'Output CGST', 'Output SGST', 'Output IGST',
  'Input CGST', 'Input SGST', 'Input IGST',
  'GST Input Credit', 'GST Payable'
)
GROUP BY account_name;

-- Expected: GST accounts exist but are NOT counted in total_expense
-- Verify by checking expense_view excludes these accounts

SELECT * FROM expense_view;

-- GST amounts should NOT be included in total_expense

-- ============================================================================
-- TEST 5: Invoice Deletion Protection
-- ============================================================================
-- Attempt to delete an issued invoice (should FAIL)

-- First, find an issued invoice
SELECT id, invoice_number, status 
FROM invoices 
WHERE status = 'issued' 
LIMIT 1;

-- Try to delete it (replace with actual ID)
-- DELETE FROM invoices WHERE id = 'your-invoice-id-here';

-- Expected: ERROR - "Cannot delete issued invoice"
-- If deletion succeeds: CRITICAL ERROR - protection not working

-- ============================================================================
-- TEST 6: Ledger Immutability Check
-- ============================================================================
-- Attempt to delete a ledger entry (should FAIL)

-- Find any ledger entry
SELECT id FROM ledger_entries LIMIT 1;

-- Try to delete it (replace with actual ID)
-- DELETE FROM ledger_entries WHERE id = 'your-ledger-id-here';

-- Expected: ERROR - "Ledger entries are immutable"
-- If deletion succeeds: CRITICAL ERROR - ledger is not protected

-- ============================================================================
-- TEST 7: Duplicate Transaction Check
-- ============================================================================
-- No invoice should have multiple non-reversal transactions

SELECT 
  source_id,
  COUNT(*) as transaction_count
FROM transactions
WHERE source_type = 'invoice'
  AND description NOT LIKE 'REVERSAL:%'
GROUP BY source_id
HAVING COUNT(*) > 1;

-- Expected: NO ROWS (each invoice has exactly one transaction)
-- If rows appear: ERROR - duplicate transactions exist

-- ============================================================================
-- TEST 8: Reversal Correctness Check
-- ============================================================================
-- For cancelled invoices, original + reversal should net to zero

WITH invoice_ledger AS (
  SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.status,
    l.account_name,
    SUM(l.debit) as total_debit,
    SUM(l.credit) as total_credit,
    SUM(l.debit - l.credit) as net_balance
  FROM invoices i
  JOIN transactions t ON t.source_id = i.id AND t.source_type = 'invoice'
  JOIN ledger_entries l ON l.transaction_id = t.id
  WHERE i.status = 'cancelled'
  GROUP BY i.id, i.invoice_number, i.status, l.account_name
)
SELECT 
  invoice_id,
  invoice_number,
  account_name,
  net_balance
FROM invoice_ledger
WHERE ABS(net_balance) > 0.01;

-- Expected: NO ROWS (all cancelled invoices net to zero)
-- If rows appear: ERROR - reversals are incomplete

-- ============================================================================
-- TEST 9: Accounts Receivable Sanity Check
-- ============================================================================
-- AR should equal sum of issued (not cancelled) invoice totals

WITH issued_invoices AS (
  SELECT SUM(total_amount) as total_issued
  FROM invoices
  WHERE status = 'issued'
),
ledger_ar AS (
  SELECT SUM(debit - credit) as ar_balance
  FROM ledger_entries
  WHERE account_name = 'Accounts Receivable'
)
SELECT 
  i.total_issued,
  l.ar_balance,
  ABS(i.total_issued - l.ar_balance) as difference
FROM issued_invoices i, ledger_ar l
WHERE ABS(i.total_issued - l.ar_balance) > 0.01;

-- Expected: NO ROWS (AR matches issued invoices)
-- If rows appear: WARNING - AR may be incorrect (investigate)

-- ============================================================================
-- TEST 10: Revenue Matches Sales Ledger
-- ============================================================================
-- Revenue view should match Sales account in ledger

WITH sales_ledger AS (
  SELECT SUM(credit - debit) as sales_balance
  FROM ledger_entries
  WHERE account_name = 'Sales'
),
revenue_calc AS (
  SELECT total_revenue
  FROM revenue_view
  LIMIT 1
)
SELECT 
  s.sales_balance,
  r.total_revenue,
  ABS(s.sales_balance - r.total_revenue) as difference
FROM sales_ledger s, revenue_calc r
WHERE ABS(s.sales_balance - r.total_revenue) > 0.01;

-- Expected: NO ROWS (revenue view matches ledger)
-- If rows appear: ERROR - revenue calculation is wrong

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================
-- Run this to get an overview of the accounting system state

SELECT 
  'Total Invoices' as metric,
  COUNT(*)::text as value
FROM invoices
UNION ALL
SELECT 
  'Draft Invoices',
  COUNT(*)::text
FROM invoices WHERE status = 'draft'
UNION ALL
SELECT 
  'Issued Invoices',
  COUNT(*)::text
FROM invoices WHERE status = 'issued'
UNION ALL
SELECT 
  'Cancelled Invoices',
  COUNT(*)::text
FROM invoices WHERE status = 'cancelled'
UNION ALL
SELECT 
  'Total Transactions',
  COUNT(*)::text
FROM transactions
UNION ALL
SELECT 
  'Total Ledger Entries',
  COUNT(*)::text
FROM ledger_entries
UNION ALL
SELECT 
  'Unbalanced Transactions',
  COUNT(DISTINCT t.id)::text
FROM transactions t
JOIN ledger_entries l ON l.transaction_id = t.id
GROUP BY t.id
HAVING ABS(SUM(l.debit) - SUM(l.credit)) > 0.01
UNION ALL
SELECT 
  'Total Revenue',
  COALESCE((SELECT total_revenue::text FROM revenue_view LIMIT 1), '0')
UNION ALL
SELECT 
  'Total Expenses',
  COALESCE((SELECT total_expense::text FROM expense_view LIMIT 1), '0')
UNION ALL
SELECT 
  'Net Profit',
  COALESCE((SELECT net_profit::text FROM net_profit_view LIMIT 1), '0')
UNION ALL
SELECT 
  'Accounts Receivable',
  COALESCE((SELECT total_receivable::text FROM accounts_receivable_view LIMIT 1), '0')
UNION ALL
SELECT 
  'GST Payable',
  COALESCE((SELECT gst_payable::text FROM gst_payable_view LIMIT 1), '0');

-- ============================================================================
-- VALIDATION CHECKLIST
-- ============================================================================
-- 
-- ✅ All transactions are balanced (Test 1)
-- ✅ Dashboard is stable on refresh (Test 2)
-- ✅ Net Profit = Revenue - Expenses (Test 3)
-- ✅ GST not included in expenses (Test 4)
-- ✅ Issued invoices cannot be deleted (Test 5)
-- ✅ Ledger entries cannot be deleted (Test 6)
-- ✅ No duplicate transactions (Test 7)
-- ✅ Cancelled invoices net to zero (Test 8)
-- ✅ AR matches issued invoices (Test 9)
-- ✅ Revenue matches Sales ledger (Test 10)
--
-- If ALL tests pass: System is VALID ✅
-- If ANY test fails: System has ERRORS ❌
-- ============================================================================
