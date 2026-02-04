-- Force Refresh of Expenses Table Cache

-- 1. Ensure column exists (idempotent)
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'voided'));

-- 2. Force a schema cache reload by performing a noticeable DDL change
-- (Adding and dropping a dummy column often wakes up PostgREST more effectively than NOTIFY)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS _force_refresh int;
ALTER TABLE public.expenses DROP COLUMN _force_refresh;

-- 3. Explicitly reload schema just in case
NOTIFY pgrst, 'reload schema';
