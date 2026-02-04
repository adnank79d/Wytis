-- Fix Missing Audit Logs and Transactions columns
-- Re-creates audit_logs if missing, fixing the FK issue that likely caused it to fail initially.

-- 1. Create audit_logs table (if missing)
-- Changed reference from public.users to auth.users as public.users does not exist in this schema setup
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, 
  action text NOT NULL,
  entity_type text,   -- Added directly in create
  entity_id uuid,     -- Added directly in create
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Add columns if table existed but columns were missing (Idempotent)
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id uuid;

-- 3. Create Index
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 4. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.business_id = audit_logs.business_id
    AND m.user_id = auth.uid()
    AND m.role = 'owner'
  )
);

-- 5. Update transactions table (if missing description)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS description text;

-- 6. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
