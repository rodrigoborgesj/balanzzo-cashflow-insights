-- Add pagarme_plan_id column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS pagarme_plan_id text;

-- Add unique constraint on name column
ALTER TABLE public.subscription_plans 
ADD CONSTRAINT subscription_plans_name_unique UNIQUE (name);

-- Clear existing data and insert the Balanzzo subscription plans
DELETE FROM public.subscription_plans;

INSERT INTO public.subscription_plans (name, price_cents, billing_cycle, features, active, pagarme_plan_id)
VALUES 
  ('Balanzzo Basic', 2990, 'monthly', '["Gestão financeira básica", "Relatórios mensais", "Suporte por email"]'::jsonb, true, 'plan_zboqYyNFEFO81EBQ'),
  ('Balanzzo Premium', 4990, 'monthly', '["Gestão financeira avançada", "Relatórios detalhados", "Suporte prioritário", "Integrações"]'::jsonb, true, 'plan_3emkElLTNzSVdVA7'),
  ('Balanzzo Semestral', 14990, 'semiannual', '["6 meses com desconto", "Todas as funcionalidades Premium", "Suporte VIP"]'::jsonb, true, 'plan_vmQOLPKZFDt2qx6k');