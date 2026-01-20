-- FIX USER ACCOUNT
-- User ID: 77130221-4bc4-45f3-a0f1-7296eb108794

DO $$
DECLARE
    target_user_id uuid := '77130221-4bc4-45f3-a0f1-7296eb108794';
    target_email text := 'sheebusheikh8@gmail.com';
    final_business_id uuid;
BEGIN
    -- 1. Ensure public.users record exists
    INSERT INTO public.users (id, email)
    VALUES (target_user_id, target_email)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Check for Membership
    SELECT business_id INTO final_business_id
    FROM public.memberships
    WHERE user_id = target_user_id
    LIMIT 1;

    -- If no membership, create Business + Membership
    IF final_business_id IS NULL THEN
        INSERT INTO public.businesses (name)
        VALUES ('My Business')
        RETURNING id INTO final_business_id;

        INSERT INTO public.memberships (user_id, business_id, role)
        VALUES (target_user_id, final_business_id, 'owner');
        
        RAISE NOTICE 'Created missing business/membership for user.';
    ELSE
        RAISE NOTICE 'User already has a business: %', final_business_id;
    END IF;

    -- 3. Force Active Subscription
    DELETE FROM public.subscriptions WHERE business_id = final_business_id;

    INSERT INTO public.subscriptions (
        id, business_id, status, price_id, quantity, cancel_at_period_end,
        current_period_start, current_period_end, created, metadata
    )
    VALUES (
        'sub_fix_' || floor(extract(epoch from now())),
        final_business_id,
        'active',
        'price_business_month',
        1,
        false,
        now(),
        now() + interval '1 year',
        now(),
        '{"type": "manual_fix"}'
    );

    RAISE NOTICE 'Subscription activated for 1 year.';
END $$;
