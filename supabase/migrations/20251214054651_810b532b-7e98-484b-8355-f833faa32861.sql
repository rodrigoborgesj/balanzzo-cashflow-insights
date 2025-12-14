-- Update company plans names
UPDATE subscription_plans 
SET name = 'Plano Empresarial Mensal'
WHERE id = '90331145-e201-41c0-a2a2-72f52dbf1461';

UPDATE subscription_plans 
SET name = 'Plano Empresarial Trimestral'
WHERE id = '5ad58c75-5072-4219-af70-3ce8eac01ec0';

UPDATE subscription_plans 
SET name = 'Plano Empresarial Semestral'
WHERE id = '82abd780-d630-4e7a-9672-2a327c2ac22e';

-- Update personal plan name and price to R$19.90 (1990 cents)
UPDATE subscription_plans 
SET name = 'Plano Pessoal Mensal', price_cents = 1990
WHERE id = '7e537c02-814e-4906-976e-95eee34d607e';