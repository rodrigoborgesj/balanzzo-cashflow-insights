
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_billing_cycle_check;
ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_billing_cycle_check 
  CHECK (billing_cycle = ANY (ARRAY['monthly','quarterly','semiannual','yearly','one_time']));

UPDATE public.subscription_plans 
SET price_cents = 22200, 
    features = '["Acesso completo ao sistema","Gestão de fluxo de caixa","Relatórios DRE","Conciliação bancária","Suporte por email","Economia vs. mensal"]'::jsonb,
    updated_at = now()
WHERE id = '5ad58c75-5072-4219-af70-3ce8eac01ec0';

UPDATE public.subscription_plans 
SET price_cents = 39800,
    features = '["Acesso completo ao sistema","Gestão de fluxo de caixa","Relatórios DRE","Conciliação bancária","Suporte prioritário","Economia vs. mensal"]'::jsonb,
    updated_at = now()
WHERE id = '82abd780-d630-4e7a-9672-2a327c2ac22e';

INSERT INTO public.subscription_plans (name, price_cents, billing_cycle, subscription_type, features, active)
SELECT 'Plano Empresarial Anual', 74900, 'yearly', 'company',
  '["Acesso completo ao sistema","Gestão de fluxo de caixa","Relatórios DRE","Conciliação bancária","Suporte prioritário VIP","Maior economia do ano"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Plano Empresarial Anual');

INSERT INTO public.subscription_plans (name, price_cents, billing_cycle, subscription_type, features, active)
SELECT 'Diagnóstico Financeiro Estratégico Balanzzo', 120000, 'one_time', 'company',
  '["Raio-x financeiro da operação","Levantamento completo dos números","Organização de receitas e despesas","Estruturação do fluxo financeiro","Mapeamento de dívidas","Identificação de gargalos","Revisão de orçamento","Plano financeiro prático para os próximos meses","Duração de 2 meses com acompanhamento direto na operação"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Diagnóstico Financeiro Estratégico Balanzzo');
