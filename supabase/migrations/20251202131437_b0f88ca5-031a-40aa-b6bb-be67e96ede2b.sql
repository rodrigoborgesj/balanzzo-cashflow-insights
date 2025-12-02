-- Criar assinatura para Erica de Souza (contato@karuanambiental.com.br)
-- Plano Trimestral - 90 dias de acesso
INSERT INTO public.subscriptions (
  user_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
) VALUES (
  '850df784-577c-40df-b0d6-9012c3f78f16',
  '5ad58c75-5072-4219-af70-3ce8eac01ec0',
  'active',
  NOW(),
  NOW() + INTERVAL '90 days'
);