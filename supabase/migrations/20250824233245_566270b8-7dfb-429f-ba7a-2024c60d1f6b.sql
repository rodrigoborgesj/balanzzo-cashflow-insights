-- Grant 45-day free access to rodrigotubino@gmail.com
DO $$
DECLARE
    target_user_id UUID;
    free_plan_id UUID;
BEGIN
    -- Find the user ID for rodrigotubino@gmail.com
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'rodrigotubino@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User rodrigotubino@gmail.com not found';
    END IF;
    
    -- Generate a UUID for free plan or use existing plan
    SELECT id INTO free_plan_id FROM public.subscription_plans LIMIT 1;
    IF free_plan_id IS NULL THEN
        free_plan_id := gen_random_uuid();
    END IF;
    
    -- Delete any existing subscription first
    DELETE FROM public.subscriptions WHERE user_id = target_user_id;
    
    -- Insert subscription for 45-day free access
    INSERT INTO public.subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created_at,
        updated_at
    ) VALUES (
        target_user_id,
        free_plan_id,
        'active',
        now(),
        now() + INTERVAL '45 days',
        false,
        now(),
        now()
    );
        
    RAISE NOTICE 'Successfully granted 45-day free access to rodrigotubino@gmail.com until %', now() + INTERVAL '45 days';
END $$;