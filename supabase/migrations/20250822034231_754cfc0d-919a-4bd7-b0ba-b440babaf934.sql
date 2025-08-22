-- Update subscription_plans table with the two required plans
INSERT INTO public.subscription_plans (id, name, price_cents, billing_cycle, features, active) VALUES
('monthly', 'Plano Mensal', 19700, 'monthly', '["Acesso completo à plataforma", "Importação ilimitada de extratos", "Relatórios DRE automatizados", "Fluxo de caixa em tempo real", "Suporte por email"]'::jsonb, true),
('semiannual', 'Plano Semestral', 98500, 'semiannual', '["Acesso completo à plataforma por 6 meses", "Importação ilimitada de extratos", "Relatórios DRE automatizados", "Fluxo de caixa em tempo real", "Suporte prioritário", "Consultoria mensal inclusa"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  billing_cycle = EXCLUDED.billing_cycle,
  features = EXCLUDED.features,
  active = EXCLUDED.active,
  updated_at = now();