-- Migration: 20260129000014_erp_formulae.sql
-- Description: Implement ERP Master Formulae (Input Tax Credit, Net GST, Net Profit)

BEGIN;

-- 1. Refactor GST Records to support Input/Output
ALTER TABLE public.gst_records
DROP CONSTRAINT IF EXISTS gst_records_source_type_check;

ALTER TABLE public.gst_records
ADD CONSTRAINT gst_records_source_type_check CHECK (source_type IN ('invoice', 'expense'));

ALTER TABLE public.gst_records
ADD COLUMN IF NOT EXISTS gst_direction text NOT NULL DEFAULT 'output' CHECK (gst_direction IN ('input', 'output'));

-- Create Index on direction for easier summing
CREATE INDEX IF NOT EXISTS idx_gst_records_direction ON public.gst_records(gst_direction);


-- 2. Update Profit & Loss View
-- Add 'GST Input Credit' to the exclusion list so it's not treated as an Expense.
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
    -- Balance Sheet Accounts (Exclude from P&L)
    'Accounts Receivable', 
    'Bank', 
    'Cash', 
    'Inventory', 
    'Accounts Payable', 
    'GST Payable',         -- Output Liability
    'GST Input Credit',    -- Input Asset
    'Capital', 
    'Create Capital',
    'Retained Earnings',
    'Opening Balance Equity'
)
GROUP BY business_id, account_name;


-- 3. Update Invoice Trigger to set 'output' direction
CREATE OR REPLACE FUNCTION public.handle_invoice_issued()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trx_id uuid;
  period text;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != 'issued' AND NEW.status = 'issued') OR
     (TG_OP = 'INSERT' AND NEW.status = 'issued') THEN
     
     INSERT INTO public.transactions (
       business_id, source_type, source_id, amount, transaction_type, transaction_date
     )
     VALUES (
       NEW.business_id, 'invoice', NEW.id, NEW.total_amount, 'credit', NEW.invoice_date
     )
     RETURNING id INTO trx_id;

     -- Debit AR (Total)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Accounts Receivable', NEW.total_amount, 0);
     
     -- Credit Sales (Subtotal)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Sales', 0, NEW.subtotal);
     
     -- Credit GST Payable (Output Liability)
     IF NEW.gst_amount > 0 THEN
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'GST Payable', 0, NEW.gst_amount);

        -- GST Record (Output)
        period := to_char(NEW.invoice_date, 'YYYY-MM');
        INSERT INTO public.gst_records (
          business_id, source_type, source_id, gst_type, amount, tax_period, gst_direction
        )
        VALUES (
          NEW.business_id, 'invoice', NEW.id, 'IGST', NEW.gst_amount, period, 'output'
        );
     END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- 4. Update Expense Trigger to Handle GST Input Credit
CREATE OR REPLACE FUNCTION public.handle_expense_posted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id uuid;
    v_asset_account text;
    v_base_amount numeric;
    v_period text;
BEGIN
    IF NEW.payment_method = 'Cash' THEN
        v_asset_account := 'Cash';
    ELSE
        v_asset_account := 'Bank';
    END IF;

    -- Calculate Base Amount (Total - GST)
    -- Assumption: 'amount' column in expenses is the Invoice Total (what you paid).
    v_base_amount := NEW.amount - COALESCE(NEW.gst_amount, 0);

    -- 1. Create Transaction (For the Total Amount paid/incurred)
    INSERT INTO public.transactions (
        business_id, source_type, source_id, amount, transaction_type, transaction_date
    ) VALUES (
        NEW.business_id, 'expense', NEW.id, NEW.amount, 'debit', NEW.expense_date
    ) RETURNING id INTO v_transaction_id;

    -- 2. Ledger Entries
    
    -- Entry A: Debit Expense Category (Base Amount Only)
    INSERT INTO public.ledger_entries (
        business_id, transaction_id, account_name, debit, credit
    ) VALUES (
        NEW.business_id, v_transaction_id, NEW.category, v_base_amount, 0
    );

    -- Entry B: Debit GST Input Credit (Asset) - if any
    IF COALESCE(NEW.gst_amount, 0) > 0 THEN
        INSERT INTO public.ledger_entries (
            business_id, transaction_id, account_name, debit, credit
        ) VALUES (
            NEW.business_id, v_transaction_id, 'GST Input Credit', NEW.gst_amount, 0
        );

        -- GST Record (Input)
        v_period := to_char(NEW.expense_date, 'YYYY-MM');
        INSERT INTO public.gst_records (
            business_id, source_type, source_id, gst_type, amount, tax_period, gst_direction
        ) VALUES (
            NEW.business_id, 'expense', NEW.id, 'IGST', NEW.gst_amount, v_period, 'input'
        );
    END IF;

    -- Entry C: Credit Asset/Payable (Total Amount)
    INSERT INTO public.ledger_entries (
        business_id, transaction_id, account_name, debit, credit
    ) VALUES (
        NEW.business_id, v_transaction_id, v_asset_account, 0, NEW.amount
    );

    RETURN NEW;
END;
$$;


COMMIT;

NOTIFY pgrst, 'reload schema';
