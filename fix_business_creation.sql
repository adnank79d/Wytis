-- MANUAL FIX FOR BUSINESS CREATION ERROR
-- Run this in your Supabase Local Studio SQL Editor (http://localhost:50012/project/default/sql)

-- 1. Ensure Address Columns Exist
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS pincode text;

-- 2. Enable Business Creation (INSERT)
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
CREATE POLICY "Authenticated users can create businesses"
ON public.businesses
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. Enable Membership Creation (INSERT)
DROP POLICY IF EXISTS "Authenticated users can create memberships" ON public.memberships;
CREATE POLICY "Authenticated users can create memberships"
ON public.memberships
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
