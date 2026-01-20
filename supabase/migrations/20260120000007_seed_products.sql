-- Seed Data for Products and Prices (Mock Stripe Data)
-- Updated for new Pricing Model: Trial, Starter, Growth, Business, Enterprise

-- 1. CLEANUP: Remove old/legacy plans to prevent duplicates
DELETE FROM public.products WHERE id IN ('prod_pro', 'prod_starter_old'); 
-- (Add any other IDs if known, otherwise we trust the new ones are unique)

-- 2. Insert/Update New Plans
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

-- 3. Insert/Update Prices
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
