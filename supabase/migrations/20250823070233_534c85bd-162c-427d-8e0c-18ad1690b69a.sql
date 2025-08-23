-- Add pagarme_plan_id column to subscription_plans table if it doesn't exist
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS pagarme_plan_id text;

-- Update existing plans with Pagar.me IDs or insert new ones
DO $$
BEGIN
    -- Balanzzo Basic
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Balanzzo Basic') THEN
        UPDATE subscription_plans 
        SET pagarme_plan_id = 'plan_zboqYyNFEFO81EBQ',
            price_cents = 2990,
            billing_cycle = 'monthly',
            features = '["Gestão financeira básica", "Relatórios mensais", "Suporte por email"]'::jsonb
        WHERE name = 'Balanzzo Basic';
    ELSE
        INSERT INTO subscription_plans (name, price_cents, billing_cycle, features, active, pagarme_plan_id)
        VALUES ('Balanzzo Basic', 2990, 'monthly', '["Gestão financeira básica", "Relatórios mensais", "Suporte por email"]'::jsonb, true, 'plan_zboqYyNFEFO81EBQ');
    END IF;

    -- Balanzzo Premium  
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Balanzzo Premium') THEN
        UPDATE subscription_plans 
        SET pagarme_plan_id = 'plan_3emkElLTNzSVdVA7',
            price_cents = 4990,
            billing_cycle = 'monthly',
            features = '["Gestão financeira avançada", "Relatórios detalhados", "Suporte prioritário", "Integrações"]'::jsonb
        WHERE name = 'Balanzzo Premium';
    ELSE
        INSERT INTO subscription_plans (name, price_cents, billing_cycle, features, active, pagarme_plan_id)
        VALUES ('Balanzzo Premium', 4990, 'monthly', '["Gestão financeira avançada", "Relatórios detalhados", "Suporte prioritário", "Integrações"]'::jsonb, true, 'plan_3emkElLTNzSVdVA7');
    END IF;

    -- Balanzzo Semestral (using monthly billing_cycle since semiannual is not allowed)
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Balanzzo Semestral') THEN
        UPDATE subscription_plans 
        SET pagarme_plan_id = 'plan_vmQOLPKZFDt2qx6k',
            price_cents = 14990,
            billing_cycle = 'monthly',
            features = '["6 meses com desconto", "Todas as funcionalidades Premium", "Suporte VIP"]'::jsonb
        WHERE name = 'Balanzzo Semestral';
    ELSE
        INSERT INTO subscription_plans (name, price_cents, billing_cycle, features, active, pagarme_plan_id)
        VALUES ('Balanzzo Semestral', 14990, 'monthly', '["6 meses com desconto", "Todas as funcionalidades Premium", "Suporte VIP"]'::jsonb, true, 'plan_vmQOLPKZFDt2qx6k');
    END IF;
END $$;