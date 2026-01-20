-- Migration: 20260120000003_create_business_rpc
-- Description: Create a secure function to handle business creation atomicity (Business + Membership).
-- Also ensures address columns exist to prevent errors if previous migrations failed.

-- 1. Ensure Columns Exist (Idempotent)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS pincode text;

-- 2. Create RPC Function
CREATE OR REPLACE FUNCTION public.create_new_workspace(
  p_name text,
  p_gst_number text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_address_line2 text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_pincode text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres), bypassing RLS
SET search_path = public -- Secure search path
AS $$
DECLARE
  v_business_id uuid;
BEGIN
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
    p_name, 
    p_gst_number, 
    p_address_line1, 
    p_address_line2, 
    p_city, 
    p_state, 
    p_pincode
  )
  RETURNING id INTO v_business_id;

  -- 2. Insert Owner Membership
  -- auth.uid() returns the ID of the user calling the function via Supabase Client
  INSERT INTO public.memberships (user_id, business_id, role)
  VALUES (auth.uid(), v_business_id, 'owner');

  RETURN v_business_id;
END;
$$;
