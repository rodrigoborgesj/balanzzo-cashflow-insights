-- Primeiro, deletar qualquer assinatura existente para este usuário
DELETE FROM subscriptions WHERE user_id = '8ae2c7f0-8ed4-4786-94c0-7a05ddc5b9f5';

-- Criar nova assinatura ativa para o usuário teste
INSERT INTO subscriptions (
  user_id, 
  plan_id, 
  status, 
  current_period_start, 
  current_period_end, 
  cancel_at_period_end,
  pagarme_subscription_id
) 
VALUES (
  '8ae2c7f0-8ed4-4786-94c0-7a05ddc5b9f5',
  (SELECT id FROM subscription_plans WHERE active = true ORDER BY price_cents ASC LIMIT 1),
  'active',
  now(),
  now() + interval '1 year',
  false,
  'teste-admin-access'
);