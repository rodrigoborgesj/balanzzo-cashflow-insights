-- Grant 20-day trial access using existing monthly plan
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
  (SELECT id FROM auth.users WHERE email = 'brunopeckdelima@gmail.com'),
  (SELECT id FROM subscription_plans WHERE billing_cycle = 'monthly' AND active = true LIMIT 1),
  'active',
  now(),
  now() + interval '20 days',
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '20 days',
  cancel_at_period_end = true,
  updated_at = now();