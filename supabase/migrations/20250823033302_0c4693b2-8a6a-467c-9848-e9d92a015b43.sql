INSERT INTO subscriptions (
  user_id, 
  plan_id, 
  status, 
  current_period_start, 
  current_period_end, 
  cancel_at_period_end,
  pagarme_subscription_id
) 
SELECT 
  '8ae2c7f0-8ed4-4786-94c0-7a05ddc5b9f5'::uuid,
  (SELECT id FROM subscription_plans WHERE active = true ORDER BY price_cents ASC LIMIT 1),
  'active',
  now(),
  now() + interval '1 year',
  false,
  'teste-admin-access'
ON CONFLICT (user_id, plan_id) DO UPDATE SET
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '1 year',
  cancel_at_period_end = false,
  updated_at = now();