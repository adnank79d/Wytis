-- Temporary fix: Add a more permissive policy to memberships table
-- This will help us debug if RLS is the issue

-- Add a policy that allows users to see ALL memberships (TEMPORARY - for debugging only!)
CREATE POLICY "temp_allow_all_memberships"
  ON public.memberships
  FOR SELECT
  USING (true);

-- After running this, refresh the dashboard
-- If it works, the issue is with auth.uid() not being set correctly
-- Then we can remove this policy and fix the real issue

-- To remove this temporary policy later:
-- DROP POLICY "temp_allow_all_memberships" ON public.memberships;
