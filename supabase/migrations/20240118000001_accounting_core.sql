-- Migration: 20240118000001_accounting_core
-- Description: Core accounting tables and automation for Wytis OS.
-- Updates: Enforced immutability via strict RLS (No UPDATE/DELETE on ledger tables).

--------------------------------------------------------------------------------
-- 1. INVOICES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  invoice_date date NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid')),
  created_at timestamptz DEFAULT now()
);

-- RLS: INVOICES
-- Invoices are mutable documents until issued, so we use FOR ALL (allows CRUD).
-- App logic should prevent editing issued invoices.
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invoices of their business"
  ON public.invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = invoices.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 2. INVOICE_ITEMS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0
);

-- RLS: INVOICE_ITEMS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invoice items of their business"
  ON public.invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      JOIN public.memberships ON memberships.business_id = invoices.business_id
      WHERE invoices.id = invoice_items.invoice_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 3. TRANSACTIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('invoice', 'expense', 'manual')),
  source_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  transaction_type text NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- RLS: TRANSACTIONS
-- IMMUTABILITY ENFORCEMENT: Only SELECT and INSERT allowed. No UPDATE/DELETE.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of their business"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = transactions.business_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions for their business"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = transactions.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 4. LEDGER_ENTRIES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS: LEDGER_ENTRIES
-- IMMUTABILITY ENFORCEMENT: Only SELECT and INSERT allowed. No UPDATE/DELETE.
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ledger entries of their business"
  ON public.ledger_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = ledger_entries.business_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ledger entries for their business"
  ON public.ledger_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = ledger_entries.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 5. GST_RECORDS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gst_records (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type = 'invoice'),
  source_id uuid NOT NULL,
  gst_type text NOT NULL CHECK (gst_type IN ('CGST', 'SGST', 'IGST')),
  amount numeric NOT NULL DEFAULT 0,
  tax_period text NOT NULL, -- YYYY-MM
  created_at timestamptz DEFAULT now()
);

-- RLS: GST_RECORDS
-- IMMUTABILITY ENFORCEMENT: Only SELECT and INSERT allowed. No UPDATE/DELETE.
ALTER TABLE public.gst_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gst records of their business"
  ON public.gst_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = gst_records.business_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create gst records for their business"
  ON public.gst_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = gst_records.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 6. INDEXING (Performance)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON public.transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON public.transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON public.ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id ON public.ledger_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_gst_records_business_id ON public.gst_records(business_id);

--------------------------------------------------------------------------------
-- 7. AUTOMATION FUNCTION
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_invoice_issued()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trx_id uuid;
  period text;
BEGIN
  -- Trigger logic: Only on status switch to 'issued' OR insert as 'issued'
  -- Important: Avoid double processing if status was already 'issued' (handled by OLD check)
  
  IF (TG_OP = 'UPDATE' AND OLD.status != 'issued' AND NEW.status = 'issued') OR
     (TG_OP = 'INSERT' AND NEW.status = 'issued') THEN
     
     -- 1. Create Transaction Header
     -- Invoices are Income (Credit value to business usually, but in Transactions table we use 'credit' to denote Income flow)
     INSERT INTO public.transactions (
       business_id, source_type, source_id, amount, transaction_type, transaction_date
     )
     VALUES (
       NEW.business_id, 'invoice', NEW.id, NEW.total_amount, 'credit', NEW.invoice_date
     )
     RETURNING id INTO trx_id;

     -- 2. Generate Ledger Entries (Double Entry)
     -- Entry A: Debit Accounts Receivable (Full Amount)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Accounts Receivable', NEW.total_amount, 0);
     
     -- Entry B: Credit Sales Income (Subtotal)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Sales', 0, NEW.subtotal);
     
     -- Entry C: Credit GST Payable (Tax Amount) - if any
     IF NEW.gst_amount > 0 THEN
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'GST Payable', 0, NEW.gst_amount);
     END IF;

     -- 3. Generate GST Records
     -- Derived from Invoice Data.
     -- Assumption: Defaulting to IGST in absence of granular location data in this schema.
     -- Ideally this would split to CGST/SGST based on place of supply.
     period := to_char(NEW.invoice_date, 'YYYY-MM');
     
     IF NEW.gst_amount > 0 THEN
       INSERT INTO public.gst_records (
         business_id, source_type, source_id, gst_type, amount, tax_period
       )
       VALUES (
         NEW.business_id, 'invoice', NEW.id, 'IGST', NEW.gst_amount, period
       );
     END IF;
     
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger Definition
DROP TRIGGER IF EXISTS on_invoice_issued_trigger ON public.invoices;
CREATE TRIGGER on_invoice_issued_trigger
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_issued();
