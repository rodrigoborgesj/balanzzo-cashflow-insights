-- Remover constraint antiga de billing_cycle
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_billing_cycle_check;

-- Adicionar nova constraint que aceita os ciclos necessários
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_billing_cycle_check 
CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual', 'yearly'));

-- Desativar planos antigos
UPDATE subscription_plans SET active = false WHERE active = true;

-- Inserir novos planos Balanzzo
INSERT INTO subscription_plans (name, price_cents, billing_cycle, features, active, pagarme_plan_id) VALUES 
('Plano Mensal', 7800, 'monthly', '["Acesso completo ao sistema", "Gestão de fluxo de caixa", "Relatórios DRE", "Conciliação bancária", "Suporte por email"]'::jsonb, true, NULL),
('Plano Trimestral', 20400, 'quarterly', '["Acesso completo ao sistema", "Gestão de fluxo de caixa", "Relatórios DRE", "Conciliação bancária", "Suporte por email", "Economia de 13%"]'::jsonb, true, NULL),
('Plano Semestral', 36000, 'semiannual', '["Acesso completo ao sistema", "Gestão de fluxo de caixa", "Relatórios DRE", "Conciliação bancária", "Suporte prioritário", "Economia de 23%"]'::jsonb, true, NULL);