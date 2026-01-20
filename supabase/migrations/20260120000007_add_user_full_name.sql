-- Migration: 20260120000007_add_user_full_name
-- Description: Adds full_name to public.users and updates trigger to capture it.

--------------------------------------------------------------------------------
-- 1. ADD COLUMN
--------------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;

--------------------------------------------------------------------------------
-- 2. UPDATE TRIGGER FUNCTION
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER CHECK (search_path = public)
AS $$
DECLARE
  new_business_id uuid;
  user_email text;
  business_name text;
  user_full_name text;
BEGIN
  user_email := NEW.email;
  -- Capture name from metadata, fallback to empty string
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  
  -- Default business name
  business_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name', 
    split_part(user_email, '@', 1) || '''s Business'
  );

  -- 1. Create user record
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, user_email, user_full_name);

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
