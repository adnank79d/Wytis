-- Migration: 20240118000005_crm_customers
-- Description: Adds Customers table for CRM and links to Invoices.

--------------------------------------------------------------------------------
-- 1. CUSTOMERS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  tax_id text, -- e.g. GSTIN
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers of their business"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = customers.business_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage customers of their business"
  ON public.customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = customers.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 2. LINK INVOICES TO CUSTOMERS
--------------------------------------------------------------------------------
-- Make customer_id nullable for now to support backward compatibility with existing invoices
-- that only have customer_name string.
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);

--------------------------------------------------------------------------------
-- 3. INDEXING
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
