-- Migration: 20260120000008_fix_duplicates
-- Description: Explicitly cleanup duplicate products/prices and enforce canonical plans.

-- 1. Delete any products that are NOT our canonical set
-- This removes old 'Starter Plan', 'Pro Plan' or random IDs
DELETE FROM public.prices 
WHERE product_id NOT IN ('prod_starter', 'prod_growth', 'prod_business', 'prod_enterprise');

DELETE FROM public.products 
WHERE id NOT IN ('prod_starter', 'prod_growth', 'prod_business', 'prod_enterprise');

-- 2. Upsert Canonical Products (Ensures they exist and have correct details)
INSERT INTO public.products (id, active, name, description, image, metadata)
VALUES 
('prod_starter', true, 'Starter', 'For individuals & freelancers', 'https://placehold.co/400', '{"index": 0, "tier": "starter"}'),
('prod_growth', true, 'Growth', 'For small teams', 'https://placehold.co/400', '{"index": 1, "tier": "growth"}'),
('prod_business', true, 'Business', 'For scaling organizations', 'https://placehold.co/400', '{"index": 2, "tier": "business"}'),
('prod_enterprise', true, 'Enterprise', 'For large scale custom needs', 'https://placehold.co/400', '{"index": 3, "tier": "enterprise"}')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata,
    active = EXCLUDED.active;

-- 3. Upsert Canonical Prices
INSERT INTO public.prices (id, product_id, active, description, unit_amount, currency, type, interval, interval_count)
VALUES
('price_starter_month', 'prod_starter', true, 'Starter Monthly', 29900, 'inr', 'recurring', 'month', 1),
('price_growth_month', 'prod_growth', true, 'Growth Monthly', 79900, 'inr', 'recurring', 'month', 1),
('price_business_month', 'prod_business', true, 'Business Monthly', 199900, 'inr', 'recurring', 'month', 1),
('price_enterprise_month', 'prod_enterprise', true, 'Enterprise Custom', 0, 'inr', 'recurring', 'month', 1)
ON CONFLICT (id) DO UPDATE SET
    unit_amount = EXCLUDED.unit_amount,
    currency = EXCLUDED.currency,
    description = EXCLUDED.description;
