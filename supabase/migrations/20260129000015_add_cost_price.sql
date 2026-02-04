-- Migration: 20260129000015_add_cost_price.sql
-- Description: Add cost_price to products and invoice_items for COGS calculation.

BEGIN;

-- 1. Add cost_price to public.products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- 2. Add cost_price to public.invoice_items
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- 3. Add cost_price to public.inventory_products (if acts as source of truth for stock value)
-- Assuming products table is the catalog.

COMMIT;

NOTIFY pgrst, 'reload schema';
