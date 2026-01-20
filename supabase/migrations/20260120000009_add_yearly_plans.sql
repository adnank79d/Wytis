-- Add Yearly Plans
-- Example of how to add more pricing options to existing products

INSERT INTO public.prices (id, product_id, active, description, unit_amount, currency, type, interval, interval_count)
VALUES
('price_starter_year', 'prod_starter', true, 'Starter Yearly', 299000, 'inr', 'recurring', 'year', 1), -- 10 months price for 12 months
('price_growth_year', 'prod_growth', true, 'Growth Yearly', 799000, 'inr', 'recurring', 'year', 1),
('price_business_year', 'prod_business', true, 'Business Yearly', 1999000, 'inr', 'recurring', 'year', 1)
ON CONFLICT (id) DO UPDATE SET
    unit_amount = EXCLUDED.unit_amount,
    currency = EXCLUDED.currency,
    description = EXCLUDED.description;
