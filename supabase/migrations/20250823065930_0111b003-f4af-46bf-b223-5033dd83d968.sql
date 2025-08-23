-- Add pagarme_plan_id column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN pagarme_plan_id text;

-- Insert or update the Balanzzo subscription plans with Pagar.me IDs
INSERT INTO public.subscription_plans (name, price_cents, billing_cycle, features, active, pagarme_plan_id)
VALUES 
  ('Balanzzo Basic', 2990, 'monthly', '["Gestão financeira básica", "Relatórios mensais", "Suporte por email"]'::jsonb, true, 'plan_zboqYyNFEFO81EBQ'),
  ('Balanzzo Premium', 4990, 'monthly', '["Gestão financeira avançada", "Relatórios detalhados", "Suporte prioritário", "Integrações"]'::jsonb, true, 'plan_3emkElLTNzSVdVA7'),
  ('Balanzzo Semestral', 14990, 'semiannual', '["6 meses com desconto", "Todas as funcionalidades Premium", "Suporte VIP"]'::jsonb, true, 'plan_vmQOLPKZFDt2qx6k')
ON CONFLICT (name) DO UPDATE SET 
  pagarme_plan_id = EXCLUDED.pagarme_plan_id,
  price_cents = EXCLUDED.price_cents,
  billing_cycle = EXCLUDED.billing_cycle,
  features = EXCLUDED.features,
  updated_at = now();