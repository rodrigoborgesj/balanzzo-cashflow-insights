-- Remove holding functionality from the system

-- Drop holding_settings table
DROP TABLE IF EXISTS public.holding_settings CASCADE;

-- Drop financial_data table  
DROP TABLE IF EXISTS public.financial_data CASCADE;

-- Remove holding-related columns from companies table
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS is_holding,
DROP COLUMN IF EXISTS holding_parent_id,
DROP COLUMN IF EXISTS display_order;

-- Remove the companies_cnpj_user_unique index and recreate the simple CNPJ unique constraint
DROP INDEX IF EXISTS companies_cnpj_user_unique;
ALTER TABLE public.companies ADD CONSTRAINT companies_cnpj_key UNIQUE (cnpj);