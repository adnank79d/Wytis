-- Migration: 20260120000005_atomic_business_creation
-- Description: Adds a secure RPC function to create a business and owner membership atomically.
-- Supersedes 20240120000000 due to timestamp ordering issues.

-- 1. Ensure Columns Exist (Idempotent)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS pincode text;

-- 2. Create RPC Function
CREATE OR REPLACE FUNCTION public.create_business_with_owner(
  name text,
  gst_number text DEFAULT NULL,
  address_line1 text DEFAULT NULL,
  address_line2 text DEFAULT NULL,
  city text DEFAULT NULL,
  state text DEFAULT NULL,
  pincode text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin), bypassing RLS for the insert
SET search_path = public -- Secure search path
AS $$
DECLARE
  new_business_id uuid;
  new_business_record record;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Insert Business
  INSERT INTO public.businesses (
    name,
    gst_number,
    address_line1,
    address_line2,
    city,
    state,
    pincode
  )
  VALUES (
    name,
    gst_number,
    address_line1,
    address_line2,
    city,
    state,
    pincode
  )
  RETURNING * INTO new_business_record;

  new_business_id := new_business_record.id;

  -- 2. Insert Membership (Owner)
  INSERT INTO public.memberships (
    user_id,
    business_id,
    role
  )
  VALUES (
    current_user_id,
    new_business_id,
    'owner'
  );

  -- Return the created business as JSON
  RETURN row_to_json(new_business_record);
END;
$$;
