-- Migration: 20240118000003_trial_logic
-- Description: Adds trial tracking columns to businesses table.

--------------------------------------------------------------------------------
-- 1. ALTER BUSINESSES TABLE
--------------------------------------------------------------------------------
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'paid'));

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_businesses_trial_status ON public.businesses(subscription_status);

--------------------------------------------------------------------------------
-- 2. BACKFILL (Safe)
--------------------------------------------------------------------------------
-- Update existing businesses to have a trial ending 14 days from their CREATION, not today.
-- If created > 14 days ago, they will be expired effectively (or we can be generous and give them 14 days from migration).
-- Let's be generous: 14 days from migration for existing users.
UPDATE public.businesses
SET trial_ends_at = now() + interval '14 days'
WHERE trial_ends_at IS NULL;

--------------------------------------------------------------------------------
-- 3. HELPER FUNCTION (Optional)
--------------------------------------------------------------------------------
-- Function to easily check if a business can write data
-- Returns true if Paid OR (Active AND Trial Not Expired)
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

  -- Logic: 
  -- 1. If Paid, access granted.
  -- 2. If 'active' (trial) and trial_ends_at > now(), access granted.
  -- 3. Otherwise (expired or time passed), access denied.
  
  IF rec.subscription_status = 'paid' THEN
    RETURN TRUE;
  END IF;

  IF rec.subscription_status = 'active' AND rec.trial_ends_at > now() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
