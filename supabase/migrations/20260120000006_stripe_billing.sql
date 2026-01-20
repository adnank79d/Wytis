-- Migration: 20260120000006_stripe_billing
-- Description: Add Stripe specific tables for billing and subscriptions

-- 1. Create custom types
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- 2. Create tables
create table if not exists stripe_customers (
  business_id uuid references public.businesses(id) on delete cascade not null primary key,
  stripe_customer_id text unique
);

create table if not exists products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

create table if not exists prices (
  id text primary key,
  product_id text references products(id),
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);

create table if not exists subscriptions (
  id text primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  status subscription_status,
  metadata jsonb,
  price_id text references prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  trial_end timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable RLS
alter table stripe_customers enable row level security;
alter table products enable row level security;
alter table prices enable row level security;
alter table subscriptions enable row level security;

-- 4. Create Policies
-- Products and Prices are viewable by everyone
create policy "Allow public read-only access-products" on products for select using (true);
create policy "Allow public read-only access-prices" on prices for select using (true);

-- Stripe Customers: Viewable by members of the business
create policy "Members can view their business stripe customer" on stripe_customers for select
using (
  exists (
    select 1 from public.memberships
    where memberships.business_id = stripe_customers.business_id
    and memberships.user_id = auth.uid()
  )
);

-- Subscriptions: Viewable by members of the business
create policy "Members can view their business subscriptions" on subscriptions for select
using (
  exists (
    select 1 from public.memberships
    where memberships.business_id = subscriptions.business_id
    and memberships.user_id = auth.uid()
  )
);

-- Note: No update policies needed for client-side usually, as these are managed via webhooks/server-actions.

-- 5. Realtime
-- Enable realtime for subscriptions if needed (optional)
alter publication supabase_realtime add table subscriptions;
