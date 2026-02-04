# Quick Start Guide - Apply Accounting Fixes

## Step 1: Apply SQL Fixes in Supabase

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of: `scripts/APPLY_ACCOUNTING_FIXES.sql`
3. Paste and click **Run**
4. Verify output shows:
   ```
   ✅ Accounting fixes applied successfully!
   ```

## Step 2: Reset Financial Data

Run in terminal:
```bash
node scripts/reset_financial_data.js
```

Expected output:
```
✅ Deleted all ledger entries
✅ Deleted all GST records
✅ Deleted all transactions
✅ Reset all invoices to draft status
```

## Step 3: Verify Dashboard Shows ₹0

1. Open browser: http://localhost:3000/dashboard
2. Refresh page (Ctrl+Shift+R)
3. Verify all metrics show ₹0:
   - Revenue: ₹0
   - Net Profit: ₹0
   - Receivables: ₹0
   - GST Payable: ₹0

## Step 4: Test Invoice Flow

### Create Invoice
1. Go to **Invoices** → **New Invoice**
2. Create invoice for ₹100
3. Save as draft
4. **Check Dashboard**: Revenue ₹0, AR ₹0 ✅

### Issue Invoice
1. Open the invoice
2. Click **Issue Invoice**
3. **Check Dashboard**: 
   - Revenue: ₹100 ✅
   - AR: ₹100 ✅

### Mark as Paid
1. Click **Mark as Paid**
2. **Check Dashboard**:
   - Revenue: ₹100 ✅
   - AR: ₹0 ✅
   - Bank: ₹100 ✅

### Delete Invoice (Optional)
1. Delete the invoice
2. **Check Dashboard**: All back to ₹0 ✅

## Step 5: Validate Data Integrity

Run in terminal:
```bash
node scripts/validate_accounting_integrity.js
```

Expected output:
```
✅ No duplicate transactions
✅ All transactions balanced
✅ No negative asset balances
✅ No GST accounts in P&L
✅ No orphaned ledger entries

✅ ALL INTEGRITY CHECKS PASSED
```

## Troubleshooting

### If invoice deletion fails:
- Check Supabase logs for errors
- Verify trigger was created: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_cleanup_invoice_financials';`

### If dashboard shows wrong values:
- Hard refresh: Ctrl+Shift+R
- Check browser console for errors
- Verify SQL views exist: `SELECT * FROM dashboard_metrics_view;`

### If payment doesn't clear AR:
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_invoice_paid_trigger';`
- Check ledger entries: `SELECT * FROM ledger_entries WHERE account_name = 'Accounts Receivable';`

## Success Criteria

✅ Dashboard shows ₹0 after reset
✅ Revenue increases when invoice issued
✅ AR decreases when invoice paid
✅ All ledger entries balanced (Dr = Cr)
✅ No duplicate transactions
✅ Invoice deletion cleans up all records

---

**You're done!** The accounting system now follows strict ledger-first architecture.
