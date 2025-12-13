-- Criar plano pessoal (PF)
INSERT INTO subscription_plans (name, price_cents, billing_cycle, subscription_type, features, active)
VALUES ('Plano Pessoal Mensal', 2900, 'monthly', 'personal', '["Conciliação bancária pessoal", "Transações ilimitadas", "Categorias personalizadas", "Importação CSV e OFX"]'::jsonb, true);

-- Criar assinatura pessoal para usuário de teste
INSERT INTO subscriptions (user_id, plan_id, status, subscription_type, current_period_start, current_period_end)
SELECT 
  '8ae2c7f0-8ed4-4786-94c0-7a05ddc5b9f5',
  id,
  'active',
  'personal',
  now(),
  now() + interval '1 year'
FROM subscription_plans 
WHERE subscription_type = 'personal' AND active = true
LIMIT 1;