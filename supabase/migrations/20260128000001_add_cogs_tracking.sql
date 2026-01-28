-- Migration: 20260128000001_add_cogs_tracking
-- Description: Add cost_price and product_id to invoice_items for COGS tracking
-- Purpose: Enable accurate Net Profit calculation (Sales - COGS - Expenses)

--------------------------------------------------------------------------------
-- 1. ADD COLUMNS TO INVOICE_ITEMS
--------------------------------------------------------------------------------
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.inventory_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;

COMMENT ON COLUMN public.invoice_items.product_id IS 'Optional link to inventory product for automatic COGS tracking';
COMMENT ON COLUMN public.invoice_items.cost_price IS 'Cost price of the item at time of invoice (for profit calculation)';

--------------------------------------------------------------------------------
-- 2. UPDATE INVOICE TRIGGER TO RECORD COGS
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

     -- Entry 1: Debit Accounts Receivable (Asset +)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Accounts Receivable', NEW.total_amount, 0);
     
     -- Entry 2: Credit Sales (Revenue +)
     INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
     VALUES (NEW.business_id, trx_id, 'Sales', 0, NEW.subtotal);
     
     -- Entry 3: Credit GST Payable (Liability +)
     IF NEW.gst_amount > 0 THEN
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'GST Payable', 0, NEW.gst_amount);
     END IF;

     -- Entry 4: Calculate and Record COGS from invoice items
     -- Sum up (cost_price * quantity) for all items with cost_price > 0
     SELECT COALESCE(SUM(cost_price * quantity), 0) INTO total_cogs
     FROM public.invoice_items
     WHERE invoice_id = NEW.id AND cost_price > 0;
     
     IF total_cogs > 0 THEN
        -- Debit Cost of Goods Sold (Expense +)
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Cost of Goods Sold', total_cogs, 0);
        
        -- Credit Inventory (Asset -)
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Inventory', 0, total_cogs);
        
        -- Optional: Update inventory product quantities
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

     -- GST Record for tax reporting
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

--------------------------------------------------------------------------------
-- 3. ENSURE TRIGGER EXISTS
--------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_invoice_issued_trigger ON public.invoices;
CREATE TRIGGER on_invoice_issued_trigger
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_issued();

--------------------------------------------------------------------------------
-- 4. ADD INDEX FOR PERFORMANCE
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);
