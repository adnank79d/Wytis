-- Migration: 20240118000000_wytis_foundation
-- Description: Core identity, ownership, and access-control foundation.

--------------------------------------------------------------------------------
-- 1. CLEANUP (Idempotency)
--------------------------------------------------------------------------------
-- Use typical drop if exists for clean re-runs during dev (optional but safe)
-- DROP TABLE IF EXISTS memberships CASCADE;
-- DROP TABLE IF EXISTS businesses CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TYPE IF EXISTS app_role CASCADE;

--------------------------------------------------------------------------------
-- 2. ENUMS & TYPES
--------------------------------------------------------------------------------
-- While the prompt asked for text, an Enum is safer for fixed allowed values.
-- However, strict compliance with "role (text, allowed values...)"
-- enables easier updates later without migration friction. We will use a Check Constraint.

--------------------------------------------------------------------------------
-- 3. USERS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now()
);

-- RLS: USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Trigger to update email if it changes in auth (Optional polish, but good for sync)
-- For now, we only insert on creation via the main trigger below.

--------------------------------------------------------------------------------
-- 4. BUSINESSES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gst_number text,
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- RLS: BUSINESSES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- users can only see businesses they are members of
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

-- Only owners can update business details
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

--------------------------------------------------------------------------------
-- 5. MEMBERSHIPS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'accountant', 'staff')),
  created_at timestamptz DEFAULT now(),
  
  -- Constraint: User can join a business only once
  UNIQUE (user_id, business_id)
);

-- RLS: MEMBERSHIPS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Users can only see memberships that include them
CREATE POLICY "Users can see own memberships"
  ON public.memberships
  FOR SELECT
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 6. AUTOMATION (SIGNUP FLOW)
--------------------------------------------------------------------------------
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER CHECK (search_path = public)
AS $$
DECLARE
  new_business_id uuid;
  user_email text;
  business_name text;
BEGIN
  user_email := NEW.email;
  -- Default business name to "User's Business" or specific metadata if available
  business_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name', 
    split_part(user_email, '@', 1) || '''s Business'
  );

  -- 1. Create user record
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, user_email);

  -- 2. Create a new business
  INSERT INTO public.businesses (name)
  VALUES (business_name)
  RETURNING id INTO new_business_id;

  -- 3. Create a membership linking the user to the business with role = 'owner'
  INSERT INTO public.memberships (user_id, business_id, role)
  VALUES (NEW.id, new_business_id, 'owner');

  RETURN NEW;
END;
$$;

-- Trigger on auth.users
-- Drop trigger if strictly recreating to avoid errors of duplicate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 7. PERFORMANCE & INDEXING
--------------------------------------------------------------------------------
-- Index for foreign keys to speed up RLS and Joins
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business_id ON public.memberships(business_id);
