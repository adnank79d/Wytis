-- Add structured address fields to customers for GST Place of Supply logic
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text;

-- Index on state for analytics/reporting
CREATE INDEX IF NOT EXISTS idx_customers_state ON public.customers(state);
