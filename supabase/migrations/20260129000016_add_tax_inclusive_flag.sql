-- Add prices_include_tax to inventory_products
BEGIN;

ALTER TABLE public.inventory_products
ADD COLUMN IF NOT EXISTS prices_include_tax BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

NOTIFY pgrst, 'reload schema';
