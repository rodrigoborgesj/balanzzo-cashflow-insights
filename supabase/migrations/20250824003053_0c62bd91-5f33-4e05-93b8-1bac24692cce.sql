-- First, create a trial plan if it doesn't exist
INSERT INTO public.subscription_plans (
  id,
  name,
  price_cents,
  billing_cycle,
  features,
  active
) VALUES (
  gen_random_uuid(),
  'Trial Gratuito',
  0,
  'trial',
  '["Acesso completo por 20 dias", "Importação ilimitada de extratos", "Relatórios DRE", "Fluxo de caixa"]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Grant 20-day trial access to specific user
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
  (SELECT id FROM subscription_plans WHERE name = 'Trial Gratuito' AND billing_cycle = 'trial' LIMIT 1),
  'active',
  now(),
  now() + interval '20 days',
  true,
  now(),
  now()
);