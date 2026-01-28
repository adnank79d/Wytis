-- Add GST columns to expenses for Input Tax Credit tracking
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS gst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS hsn_code text,
ADD COLUMN IF NOT EXISTS supplier_gstin text,
ADD COLUMN IF NOT EXISTS taxable_value numeric GENERATED ALWAYS AS (amount - gst_amount) STORED;

-- Ensure customers table has gst_number (fixing migration dependency)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS gst_number text;

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_expenses_gst_amount ON public.expenses(gst_amount);

-- Create a view for GSTR-1 (Sales / Outward Supplies) from Invoices
-- This view aggregates invoice items to show taxable value + tax breakup
CREATE OR REPLACE VIEW public.gstr1_view WITH (security_invoker = on) AS
SELECT
    i.business_id,
    i.id as invoice_id,
    i.invoice_number,
    i.invoice_date,
    c.name as customer_name,
    c.gst_number as customer_gstin,
    i.status,
    i.subtotal as taxable_value,
    i.gst_amount as total_tax,
    i.total_amount as invoice_value,
    'Regular' as invoice_type -- Can be enhanced later for Export/SEZ
FROM public.invoices i
LEFT JOIN public.customers c ON i.customer_id = c.id
WHERE i.status IN ('issued', 'paid', 'voided');

-- Create a view for GSTR-2 (Purchases / Inward Supplies) from Expenses
CREATE OR REPLACE VIEW public.gstr2_view WITH (security_invoker = on) AS
SELECT
    e.business_id,
    e.id as expense_id,
    e.description,
    e.expense_date,
    e.category,
    e.supplier_gstin,
    e.hsn_code,
    (e.amount - e.gst_amount) as taxable_value,
    e.gst_amount as input_tax,
    e.amount as total_value
FROM public.expenses e
WHERE e.gst_amount > 0;
