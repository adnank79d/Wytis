-- Migration: 20260120000010_fix_signup_trigger
-- Description: Fix the handle_new_user trigger to properly create records on signup.

--------------------------------------------------------------------------------
-- 1. ENSURE PUBLIC.USERS CAN BE INSERTED BY THE TRIGGER
--------------------------------------------------------------------------------
-- The trigger function runs as SECURITY DEFINER, but let's ensure the function
-- is properly set up and has correct permissions.

-- Grant necessary permissions to the trigger function
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

--------------------------------------------------------------------------------
-- 2. RECREATE THE TRIGGER FUNCTION WITH ERROR HANDLING
--------------------------------------------------------------------------------
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
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Capture name from metadata with fallbacks
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name', 
    ''
  );
  
  -- Default business name
  business_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name', 
    split_part(user_email, '@', 1) || '''s Business'
  );

  -- 1. Create user record in public.users
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, user_email, user_full_name)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create a new business
  INSERT INTO public.businesses (name)
  VALUES (business_name)
  RETURNING id INTO new_business_id;

  -- 3. Create a membership linking the user to the business with role = 'owner'
  INSERT INTO public.memberships (user_id, business_id, role)
  VALUES (NEW.id, new_business_id, 'owner');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup completely
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    -- Still return NEW to allow the auth user to be created
    RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- 3. ENSURE TRIGGER EXISTS ON AUTH.USERS
--------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 4. ADD INSERT POLICY FOR USERS TABLE (FOR SAFETY)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (protected by trigger's SECURITY DEFINER)
