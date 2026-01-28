-- Migration: 20260128000002_production_invoicing
-- Description: Production-ready invoicing system enhancements
-- Adds: due_date, paid_at, voided_at, void_reason, notes, customer_id, voided status

--------------------------------------------------------------------------------
-- 1. ADD PRODUCTION COLUMNS TO INVOICES
--------------------------------------------------------------------------------

-- Add new columns for production-ready invoicing
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS paid_at timestamptz,
ADD COLUMN IF NOT EXISTS voided_at timestamptz,
ADD COLUMN IF NOT EXISTS void_reason text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update status check constraint to include 'voided'
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'issued', 'paid', 'voided'));

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_business_status ON public.invoices(business_id, status);

--------------------------------------------------------------------------------
-- 2. CREATE OVERDUE INVOICES VIEW
--------------------------------------------------------------------------------

DROP VIEW IF EXISTS public.overdue_invoices_view CASCADE;

CREATE VIEW public.overdue_invoices_view WITH (security_invoker = on) AS
SELECT 
  i.*,
  CURRENT_DATE - i.due_date AS days_overdue,
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.due_date = CURRENT_DATE THEN 'due_today'
    WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'on_track'
  END AS due_status
FROM public.invoices i
WHERE i.status = 'issued'
  AND i.due_date IS NOT NULL;

--------------------------------------------------------------------------------
-- 3. ENHANCED INVOICE ISSUED TRIGGER (handles COGS + audit)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_invoice_issued()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trx_id uuid;
  period text;
  total_cogs numeric := 0;
  item_record RECORD;
BEGIN
  -- Handle ISSUED transition
  IF (TG_OP = 'UPDATE' AND OLD.status != 'issued' AND NEW.status = 'issued') OR
     (TG_OP = 'INSERT' AND NEW.status = 'issued') THEN
     
     -- Create main transaction
     INSERT INTO public.transactions (
       business_id, source_type, source_id, amount, transaction_type, transaction_date
     )
     VALUES (
       NEW.business_id, 'invoice', NEW.id, NEW.total_amount, 'credit', NEW.invoice_date
     )
     RETURNING id INTO trx_id;

     -- Entry 1: Debit Accounts Receivable (Customer owes money)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Accounts Receivable', NEW.total_amount, 0);
     
     -- Entry 2: Credit Sales (Revenue earned)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Sales', 0, NEW.subtotal);
     
     -- Entry 3: Credit GST Payable (Tax liability)
     IF NEW.gst_amount > 0 THEN
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'GST Payable', 0, NEW.gst_amount);
     END IF;

     -- Entry 4: Calculate and Record COGS from invoice items
     SELECT COALESCE(SUM(cost_price * quantity), 0) INTO total_cogs
     FROM public.invoice_items
     WHERE invoice_id = NEW.id AND cost_price > 0;
     
     IF total_cogs > 0 THEN
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Cost of Goods Sold', total_cogs, 0);
        
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Inventory', 0, total_cogs);
        
        -- Update inventory quantities
        FOR item_record IN 
          SELECT product_id, quantity 
          FROM public.invoice_items 
          WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
          UPDATE public.inventory_products 
          SET quantity = quantity - item_record.quantity,
              updated_at = now()
          WHERE id = item_record.product_id;
        END LOOP;
     END IF;

     -- GST Record
     period := to_char(NEW.invoice_date, 'YYYY-MM');
     IF NEW.gst_amount > 0 THEN
       INSERT INTO public.gst_records (
         business_id, source_type, source_id, gst_type, amount, tax_period
       )
       VALUES (
         NEW.business_id, 'invoice', NEW.id, 'IGST', NEW.gst_amount, period
       );
     END IF;

     -- Audit Log
     INSERT INTO public.audit_logs (business_id, user_id, action, entity_type, entity_id, details)
     VALUES (
       NEW.business_id, 
       auth.uid(), 
       'invoice_issued', 
       'invoice', 
       NEW.id,
       jsonb_build_object('invoice_number', NEW.invoice_number, 'amount', NEW.total_amount)
     );
     
  END IF;

  -- Update timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- 4. INVOICE PAYMENT RECORDED FUNCTION (for mark as paid)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'paid' THEN
    -- Set paid_at timestamp
    NEW.paid_at := COALESCE(NEW.paid_at, now());
    
    -- Audit Log
    INSERT INTO public.audit_logs (business_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.business_id, 
      auth.uid(), 
      'invoice_paid', 
      'invoice', 
      NEW.id,
      jsonb_build_object('invoice_number', NEW.invoice_number, 'amount', NEW.total_amount)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_paid_trigger ON public.invoices;
CREATE TRIGGER on_invoice_paid_trigger
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  WHEN (OLD.status = 'issued' AND NEW.status = 'paid')
  EXECUTE FUNCTION public.handle_invoice_paid();

--------------------------------------------------------------------------------
-- 5. INVOICE VOIDED FUNCTION (creates reversal entries)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_invoice_voided()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trx_id uuid;
  total_cogs numeric := 0;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != 'voided' AND NEW.status = 'voided' THEN
    -- Set voided_at timestamp
    NEW.voided_at := COALESCE(NEW.voided_at, now());
    
    -- Create reversal transaction
    INSERT INTO public.transactions (
      business_id, source_type, source_id, amount, transaction_type, transaction_date, description
    )
    VALUES (
      NEW.business_id, 'void', NEW.id, NEW.total_amount, 'debit', now(), 
      'VOID: Invoice #' || NEW.invoice_number || ' - ' || COALESCE(NEW.void_reason, 'No reason provided')
    )
    RETURNING id INTO trx_id;

    -- Reverse Accounts Receivable
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES (NEW.business_id, trx_id, 'Accounts Receivable', 0, NEW.total_amount);
    
    -- Reverse Sales
    INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
    VALUES (NEW.business_id, trx_id, 'Sales', NEW.subtotal, 0);
    
    -- Reverse GST Payable
    IF NEW.gst_amount > 0 THEN
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'GST Payable', NEW.gst_amount, 0);
    END IF;

    -- Reverse COGS if applicable
    SELECT COALESCE(SUM(cost_price * quantity), 0) INTO total_cogs
    FROM public.invoice_items
    WHERE invoice_id = NEW.id AND cost_price > 0;
    
    IF total_cogs > 0 THEN
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'Cost of Goods Sold', 0, total_cogs);
      
      INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
      VALUES (NEW.business_id, trx_id, 'Inventory', total_cogs, 0);
    END IF;

    -- Audit Log
    INSERT INTO public.audit_logs (business_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.business_id, 
      auth.uid(), 
      'invoice_voided', 
      'invoice', 
      NEW.id,
      jsonb_build_object('invoice_number', NEW.invoice_number, 'reason', NEW.void_reason)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_voided_trigger ON public.invoices;
CREATE TRIGGER on_invoice_voided_trigger
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  WHEN (OLD.status != 'voided' AND NEW.status = 'voided')
  EXECUTE FUNCTION public.handle_invoice_voided();

--------------------------------------------------------------------------------
-- 6. INVOICE STATS FUNCTION
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_invoice_stats(p_business_id uuid)
RETURNS TABLE (
  total_count bigint,
  draft_count bigint,
  issued_count bigint,
  paid_count bigint,
  voided_count bigint,
  total_revenue numeric,
  outstanding_amount numeric,
  collected_amount numeric,
  overdue_count bigint,
  overdue_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE status = 'draft')::bigint AS draft_count,
    COUNT(*) FILTER (WHERE status = 'issued')::bigint AS issued_count,
    COUNT(*) FILTER (WHERE status = 'paid')::bigint AS paid_count,
    COUNT(*) FILTER (WHERE status = 'voided')::bigint AS voided_count,
    COALESCE(SUM(subtotal) FILTER (WHERE status IN ('issued', 'paid')), 0) AS total_revenue,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'issued'), 0) AS outstanding_amount,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS collected_amount,
    COUNT(*) FILTER (WHERE status = 'issued' AND due_date < CURRENT_DATE)::bigint AS overdue_count,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'issued' AND due_date < CURRENT_DATE), 0) AS overdue_amount
  FROM public.invoices
  WHERE business_id = p_business_id;
END;
$$;

--------------------------------------------------------------------------------
-- 7. INVOICE UPDATED_AT TRIGGER
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_invoice_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_update_timestamp ON public.invoices;
CREATE TRIGGER on_invoice_update_timestamp
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_timestamp();

--------------------------------------------------------------------------------
-- 8. GRANT PERMISSIONS
--------------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.get_invoice_stats(uuid) TO authenticated;
