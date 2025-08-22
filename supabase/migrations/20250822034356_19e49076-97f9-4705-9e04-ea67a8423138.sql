-- Update subscription_plans table with the two required plans using proper UUIDs
DELETE FROM public.subscription_plans WHERE id IN (
  SELECT id FROM public.subscription_plans WHERE name IN ('Plano Mensal', 'Plano Semestral')
);

INSERT INTO public.subscription_plans (id, name, price_cents, billing_cycle, features, active) VALUES
(gen_random_uuid(), 'Plano Mensal', 19700, 'monthly', '["Acesso completo à plataforma", "Importação ilimitada de extratos", "Relatórios DRE automatizados", "Fluxo de caixa em tempo real", "Suporte por email"]'::jsonb, true),
(gen_random_uuid(), 'Plano Semestral', 98500, 'semiannual', '["Acesso completo à plataforma por 6 meses", "Importação ilimitada de extratos", "Relatórios DRE automatizados", "Fluxo de caixa em tempo real", "Suporte prioritário", "Consultoria mensal inclusa"]'::jsonb, true);