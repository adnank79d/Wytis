-- FORCE UPGRADE SUBSCRIPTION
-- Run this in your Supabase SQL Editor to manually give your business a plan

DO $$
DECLARE
    target_business_id uuid;
BEGIN
    -- 1. Get the business ID (First one found)
    SELECT id INTO target_business_id FROM businesses LIMIT 1;
    
    IF target_business_id IS NOT NULL THEN
        -- 2. Remove ANY existing subscriptions for this business to avoid conflicts
        DELETE FROM public.subscriptions WHERE business_id = target_business_id;

        -- 3. Insert the new active subscription
        INSERT INTO public.subscriptions (
            id, 
            business_id, 
            status, 
            price_id, 
            quantity, 
            cancel_at_period_end, 
            current_period_start, 
            current_period_end, 
            created, 
            metadata
        )
        VALUES (
            'sub_manual_' || floor(extract(epoch from now())), -- Random ID
            target_business_id, 
            'active', 
            'price_business_month', -- PLAN ID
            1, 
            false,
            now(), 
            now() + interval '1 year', 
            now(), 
            '{"type": "manual_sql_grant"}'
        );
        
        RAISE NOTICE 'Subscription granted to business %', target_business_id;
    ELSE
        RAISE NOTICE 'No business found to upgrade.';
    END IF;
END $$;
