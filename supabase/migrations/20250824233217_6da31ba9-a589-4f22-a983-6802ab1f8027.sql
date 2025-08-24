-- Grant 45-day free access to rodrigotubino@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user ID for rodrigotubino@gmail.com
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'rodrigotubino@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User rodrigotubino@gmail.com not found';
    END IF;
    
    -- Insert or update subscription for 45-day free access
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
        'free-45-days'::uuid,  -- Using a placeholder plan ID for free access
        'active',
        now(),
        now() + INTERVAL '45 days',
        false,
        now(),
        now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        status = 'active',
        current_period_start = now(),
        current_period_end = now() + INTERVAL '45 days',
        cancel_at_period_end = false,
        updated_at = now();
        
    RAISE NOTICE 'Successfully granted 45-day free access to rodrigotubino@gmail.com';
END $$;