-- ============================================================================
-- WYTIS COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor to set up the entire database
-- This combines all migrations into a single file
-- ============================================================================

--------------------------------------------------------------------------------
-- CLEANUP (Optional - uncomment to reset)
--------------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS on_invoice_issued_trigger ON public.invoices;
-- DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
-- DROP FUNCTION IF EXISTS public.handle_invoice_issued CASCADE;
-- DROP FUNCTION IF EXISTS public.check_business_access CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS prices CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS stripe_customers CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS gst_records CASCADE;
-- DROP TABLE IF EXISTS ledger_entries CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS invoice_items CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;
-- DROP TABLE IF EXISTS memberships CASCADE;
-- DROP TABLE IF EXISTS businesses CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TYPE IF EXISTS subscription_status CASCADE;
-- DROP TYPE IF EXISTS pricing_plan_interval CASCADE;
-- DROP TYPE IF EXISTS pricing_type CASCADE;

--------------------------------------------------------------------------------
-- 1. USERS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own profile" ON public.users;
CREATE POLICY "Users can see own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

--------------------------------------------------------------------------------
-- 2. BUSINESSES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gst_number text,
  currency text DEFAULT 'INR',
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'paid')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access businesses they belong to" ON public.businesses;
CREATE POLICY "Users can access businesses they belong to"
  ON public.businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = businesses.id
      AND memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update business details" ON public.businesses;
CREATE POLICY "Owners can update business details"
  ON public.businesses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = businesses.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
CREATE POLICY "Authenticated users can create businesses"
  ON public.businesses
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

--------------------------------------------------------------------------------
-- 3. MEMBERSHIPS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'accountant', 'staff')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, business_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own memberships" ON public.memberships;
CREATE POLICY "Users can see own memberships"
  ON public.memberships
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create memberships" ON public.memberships;
CREATE POLICY "Authenticated users can create memberships"
  ON public.memberships
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

--------------------------------------------------------------------------------
-- 4. INVOICES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  subtotal numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'voided')),
  notes text,
  paid_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage invoices of their business" ON public.invoices;
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
-- 5. INVOICE_ITEMS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.inventory_products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage invoice items of their business" ON public.invoice_items;
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
-- 6. TRANSACTIONS TABLE
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

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transactions of their business" ON public.transactions;
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

DROP POLICY IF EXISTS "Users can create transactions for their business" ON public.transactions;
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
-- 7. LEDGER_ENTRIES TABLE
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

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ledger entries of their business" ON public.ledger_entries;
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

DROP POLICY IF EXISTS "Users can create ledger entries for their business" ON public.ledger_entries;
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
-- 8. GST_RECORDS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gst_records (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type = 'invoice'),
  source_id uuid NOT NULL,
  gst_type text NOT NULL CHECK (gst_type IN ('CGST', 'SGST', 'IGST')),
  amount numeric NOT NULL DEFAULT 0,
  tax_period text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gst_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view gst records of their business" ON public.gst_records;
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

DROP POLICY IF EXISTS "Users can create gst records for their business" ON public.gst_records;
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
-- 9. CUSTOMERS TABLE (CRM)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  gst_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage customers of their business" ON public.customers;
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
-- 10. NOTIFICATIONS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 11. STRIPE BILLING TABLES
--------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS stripe_customers (
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  stripe_customer_id text UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS prices (
  id text PRIMARY KEY,
  product_id text REFERENCES products(id),
  active boolean,
  description text,
  unit_amount bigint,
  currency text CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  status subscription_status,
  metadata jsonb,
  price_id text REFERENCES prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access-products" ON products;
CREATE POLICY "Allow public read-only access-products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access-prices" ON prices;
CREATE POLICY "Allow public read-only access-prices" ON prices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can view their business stripe customer" ON stripe_customers;
CREATE POLICY "Members can view their business stripe customer" ON stripe_customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE memberships.business_id = stripe_customers.business_id
    AND memberships.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can view their business subscriptions" ON subscriptions;
CREATE POLICY "Members can view their business subscriptions" ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE memberships.business_id = subscriptions.business_id
    AND memberships.user_id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 12. SEED PRODUCTS AND PRICES
--------------------------------------------------------------------------------
INSERT INTO products (id, active, name, description, metadata)
VALUES 
  ('prod_wytis_pro', true, 'Wytis Pro', 'Full access to all Wytis features', '{"features": ["unlimited_invoices", "gst_reports", "multi_user"]}')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active;

INSERT INTO prices (id, product_id, active, unit_amount, currency, type, interval, interval_count, trial_period_days, description)
VALUES 
  ('price_wytis_pro_monthly', 'prod_wytis_pro', true, 99900, 'inr', 'recurring', 'month', 1, 14, 'Monthly subscription'),
  ('price_wytis_pro_yearly', 'prod_wytis_pro', true, 999900, 'inr', 'recurring', 'year', 1, 14, 'Yearly subscription (2 months free)')
ON CONFLICT (id) DO UPDATE SET 
  unit_amount = EXCLUDED.unit_amount,
  description = EXCLUDED.description,
  active = EXCLUDED.active;

--------------------------------------------------------------------------------
-- 12. INVENTORY TABLES
--------------------------------------------------------------------------------
-- Inventory Categories
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage inventory categories of their business" ON public.inventory_categories;
CREATE POLICY "Users can manage inventory categories of their business"
  ON public.inventory_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = inventory_categories.business_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Inventory Products
CREATE TABLE IF NOT EXISTS public.inventory_products (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text,
  description text,
  unit text DEFAULT 'pcs',
  unit_price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 0,
  reorder_level numeric DEFAULT 10,
  hsn_code text,
  gst_rate numeric DEFAULT 18,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage inventory products of their business" ON public.inventory_products;
CREATE POLICY "Users can manage inventory products of their business"
  ON public.inventory_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = inventory_products.business_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Inventory Movements (Stock In/Out)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity numeric NOT NULL,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage inventory movements of their business" ON public.inventory_movements;
CREATE POLICY "Users can manage inventory movements of their business"
  ON public.inventory_movements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = inventory_movements.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 12B. PAYMENTS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('received', 'made')),
  amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'upi', 'card', 'cheque', 'other')),
  reference_number text,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  party_name text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage payments of their business" ON public.payments;
CREATE POLICY "Users can manage payments of their business"
  ON public.payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.business_id = payments.business_id
      AND memberships.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 13. INDEXES
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business_id ON public.memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON public.transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON public.transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON public.ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id ON public.ledger_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_gst_records_business_id ON public.gst_records(business_id);
CREATE INDEX IF NOT EXISTS idx_businesses_trial_status ON public.businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_business_id ON public.inventory_products(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON public.inventory_products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_sku ON public.inventory_products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_business ON public.inventory_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);


--------------------------------------------------------------------------------
-- 14. FINANCIAL VIEWS
--------------------------------------------------------------------------------
-- Drop existing views first to handle column structure changes
DROP VIEW IF EXISTS public.profit_and_loss_view CASCADE;
DROP VIEW IF EXISTS public.balance_sheet_view CASCADE;
DROP VIEW IF EXISTS public.gst_summary_view CASCADE;
DROP VIEW IF EXISTS public.customer_receivables_view CASCADE;

CREATE VIEW public.profit_and_loss_view WITH (security_invoker = on) AS
SELECT
  business_id,
  account_name,
  CASE
    WHEN account_name IN ('Sales', 'Other Income') THEN 'Income'
    WHEN account_name IN ('Cost of Goods Sold', 'Expense', 'Salaries', 'Rent') THEN 'Expense'
    ELSE 'Other'
  END as category,
  SUM(credit - debit) as net_amount
FROM public.ledger_entries
WHERE account_name IN ('Sales', 'Other Income', 'Cost of Goods Sold', 'Expense', 'Salaries', 'Rent')
GROUP BY business_id, account_name;

CREATE VIEW public.balance_sheet_view WITH (security_invoker = on) AS
WITH account_balances AS (
    SELECT
        business_id,
        account_name,
        SUM(debit - credit) as balance
    FROM public.ledger_entries
    GROUP BY business_id, account_name
),
classified_balances AS (
    SELECT
        business_id,
        account_name,
        balance,
        CASE
            WHEN account_name IN ('Accounts Receivable', 'Bank', 'Cash', 'Inventory') THEN 'Asset'
            WHEN account_name IN ('GST Payable', 'Accounts Payable') THEN 'Liability'
            WHEN account_name IN ('Capital', 'Retained Earnings') THEN 'Equity'
            ELSE 'Nominal'
        END as type
    FROM account_balances
),
current_earnings AS (
    SELECT
        business_id,
        SUM(credit - debit) as amount
    FROM public.ledger_entries
    WHERE account_name IN ('Sales', 'Other Income', 'Cost of Goods Sold', 'Expense', 'Salaries', 'Rent')
    GROUP BY business_id
)
SELECT
    b.business_id,
    b.account_name,
    b.type,
    b.balance as amount
FROM classified_balances b
WHERE b.type IN ('Asset', 'Liability', 'Equity')
UNION ALL
SELECT
    e.business_id,
    'Current Earnings' as account_name,
    'Equity' as type,
    -e.amount as amount
FROM current_earnings e;

CREATE VIEW public.gst_summary_view WITH (security_invoker = on) AS
SELECT
  business_id,
  tax_period,
  gst_type,
  SUM(amount) as total_payable
FROM public.gst_records
GROUP BY business_id, tax_period, gst_type;

CREATE VIEW public.customer_receivables_view WITH (security_invoker = on) AS
SELECT
    l.business_id,
    i.id as invoice_id,
    i.invoice_number,
    i.customer_name,
    SUM(l.debit - l.credit) as outstanding_amount
FROM public.ledger_entries l
JOIN public.transactions t ON l.transaction_id = t.id
JOIN public.invoices i ON t.source_id = i.id
WHERE l.account_name = 'Accounts Receivable'
GROUP BY l.business_id, i.id, i.invoice_number, i.customer_name
HAVING SUM(l.debit - l.credit) > 0;

--------------------------------------------------------------------------------
-- 15. AUTOMATION FUNCTIONS
--------------------------------------------------------------------------------
-- Check business access function
CREATE OR REPLACE FUNCTION public.check_business_access(bid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT trial_ends_at, subscription_status 
  INTO rec
  FROM public.businesses
  WHERE id = bid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF rec.subscription_status = 'paid' THEN
    RETURN TRUE;
  END IF;

  IF rec.subscription_status = 'active' AND rec.trial_ends_at > now() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Get trial info for a business
CREATE OR REPLACE FUNCTION public.get_trial_info(bid uuid)
RETURNS TABLE(
  is_trial boolean,
  is_active boolean,
  days_remaining integer,
  trial_ends_at timestamptz,
  subscription_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT 
    b.trial_ends_at,
    b.subscription_status,
    s.status as sub_status,
    s.trial_end
  INTO rec
  FROM public.businesses b
  LEFT JOIN public.subscriptions s ON s.business_id = b.id
  WHERE b.id = bid
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT
    rec.subscription_status != 'paid' as is_trial,
    CASE 
      WHEN rec.subscription_status = 'paid' THEN true
      WHEN rec.subscription_status = 'active' AND rec.trial_ends_at > now() THEN true
      ELSE false
    END as is_active,
    CASE 
      WHEN rec.trial_ends_at > now() THEN EXTRACT(DAY FROM (rec.trial_ends_at - now()))::integer
      ELSE 0
    END as days_remaining,
    rec.trial_ends_at,
    rec.subscription_status;
END;
$$;

-- Check if trial is still active
CREATE OR REPLACE FUNCTION public.is_trial_active(bid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT trial_ends_at, subscription_status 
  INTO rec
  FROM public.businesses
  WHERE id = bid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN rec.subscription_status = 'active' AND rec.trial_ends_at > now();
END;
$$;

-- Expire trial (called when trial ends or user cancels)
CREATE OR REPLACE FUNCTION public.expire_trial(bid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update business status
  UPDATE public.businesses 
  SET subscription_status = 'expired'
  WHERE id = bid AND subscription_status = 'active';
  
  -- Update subscription status
  UPDATE public.subscriptions
  SET status = 'canceled',
      ended_at = now(),
      canceled_at = now()
  WHERE business_id = bid AND status = 'trialing';
END;
$$;

-- Upgrade to paid (called when payment succeeds)
CREATE OR REPLACE FUNCTION public.upgrade_to_paid(
  bid uuid,
  subscription_id text,
  p_price_id text,
  period_end timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update business status
  UPDATE public.businesses 
  SET subscription_status = 'paid'
  WHERE id = bid;
  
  -- Update or insert subscription
  INSERT INTO public.subscriptions (
    id,
    business_id,
    status,
    price_id,
    quantity,
    cancel_at_period_end,
    current_period_start,
    current_period_end
  )
  VALUES (
    subscription_id,
    bid,
    'active',
    p_price_id,
    1,
    false,
    now(),
    period_end
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    price_id = EXCLUDED.price_id,
    current_period_end = EXCLUDED.current_period_end;
END;
$$;

-- Invoice issued automation (with COGS tracking)
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
     -- COGS = Sum of (cost_price * quantity) for all items
     SELECT COALESCE(SUM(cost_price * quantity), 0) INTO total_cogs
     FROM public.invoice_items
     WHERE invoice_id = NEW.id AND cost_price > 0;
     
     IF total_cogs > 0 THEN
        -- Debit Cost of Goods Sold (Expense increases)
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Cost of Goods Sold', total_cogs, 0);
        
        -- Credit Inventory (Asset decreases)
        INSERT INTO public.ledger_entries (business_id, transaction_id, account_name, debit, credit)
        VALUES (NEW.business_id, trx_id, 'Inventory', 0, total_cogs);
        
        -- Update inventory product quantities (if linked)
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

DROP TRIGGER IF EXISTS on_invoice_issued_trigger ON public.invoices;
CREATE TRIGGER on_invoice_issued_trigger
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_issued();

--------------------------------------------------------------------------------
-- 16. SIGNUP TRIGGER (CRITICAL)
--------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_business_id uuid;
  user_email text;
  business_name text;
  user_full_name text;
  trial_duration interval := interval '14 days';
BEGIN
  user_email := NEW.email;
  
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name', 
    ''
  );
  
  business_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name', 
    split_part(user_email, '@', 1) || '''s Business'
  );

  -- 1. Create user record
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, user_email, user_full_name)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create business with trial
  INSERT INTO public.businesses (name, trial_ends_at, subscription_status)
  VALUES (business_name, now() + trial_duration, 'active')
  RETURNING id INTO new_business_id;

  -- 3. Create membership
  INSERT INTO public.memberships (user_id, business_id, role)
  VALUES (NEW.id, new_business_id, 'owner');

  -- 4. Create trial subscription record
  INSERT INTO public.subscriptions (
    id,
    business_id,
    status,
    price_id,
    quantity,
    cancel_at_period_end,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end
  )
  VALUES (
    'sub_trial_' || new_business_id::text,
    new_business_id,
    'trialing',
    'price_wytis_pro_monthly',
    1,
    false,
    now(),
    now() + trial_duration,
    now(),
    now() + trial_duration
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 17. BUSINESS CREATION RPC
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_business_with_owner(text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.create_business_with_owner(
    name text,
    gst_number text DEFAULT NULL,
    address_line1 text DEFAULT NULL,
    address_line2 text DEFAULT NULL,
    city text DEFAULT NULL,
    state text DEFAULT NULL,
    pincode text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id uuid;
    v_user_id uuid;
    v_trial_duration interval := interval '14 days';
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- 0. Ensure user exists in public.users (may not exist if signup trigger failed)
    INSERT INTO public.users (id, email)
    SELECT v_user_id, auth.email()
    ON CONFLICT (id) DO NOTHING;
    
    -- 1. Create business with trial
    INSERT INTO public.businesses (
        name, 
        address_line1, 
        address_line2, 
        city, 
        state, 
        pincode, 
        gst_number,
        trial_ends_at,
        subscription_status
    )
    VALUES (
        create_business_with_owner.name, 
        create_business_with_owner.address_line1, 
        create_business_with_owner.address_line2, 
        create_business_with_owner.city, 
        create_business_with_owner.state, 
        create_business_with_owner.pincode, 
        create_business_with_owner.gst_number,
        now() + v_trial_duration,
        'active'
    )
    RETURNING id INTO v_business_id;
    
    -- 2. Create membership
    INSERT INTO public.memberships (user_id, business_id, role)
    VALUES (v_user_id, v_business_id, 'owner');
    
    -- 3. Create trial subscription
    INSERT INTO public.subscriptions (
        id,
        business_id,
        status,
        price_id,
        quantity,
        cancel_at_period_end,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end
    )
    VALUES (
        'sub_trial_' || v_business_id::text,
        v_business_id,
        'trialing',
        'price_wytis_pro_monthly',
        1,
        false,
        now(),
        now() + v_trial_duration,
        now(),
        now() + v_trial_duration
    );
    
    RETURN v_business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_business_with_owner TO authenticated;

--------------------------------------------------------------------------------
-- DONE!
--------------------------------------------------------------------------------
-- Run this entire script in Supabase SQL Editor
-- It will create all tables, policies, functions, triggers, and seed data
