-- Critical Security Fix: Update RLS policies for all sensitive tables
-- This migration fixes the major security vulnerability where tables used 'public' role
-- instead of 'authenticated' role, potentially allowing unauthorized access

-- 1. Fix companies table RLS policies
DROP POLICY IF EXISTS "Acesso à própria empresa" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "authenticated_users_view_own_company" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_company" 
ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_company" 
ON public.companies 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deny_anonymous_access_companies" 
ON public.companies 
FOR ALL 
TO anon, service_role 
USING (false);

-- 2. Fix transacoes_conciliadas table RLS policies
DROP POLICY IF EXISTS "Usuario acessa suas transacoes diretamente ou via empresa" ON public.transacoes_conciliadas;

CREATE POLICY "authenticated_users_access_own_transactions" 
ON public.transacoes_conciliadas 
FOR ALL 
TO authenticated 
USING (
  (auth.uid() = user_id) OR 
  (company_id IN (
    SELECT id FROM public.companies 
    WHERE user_id = auth.uid()
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (company_id IN (
    SELECT id FROM public.companies 
    WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "deny_anonymous_access_transactions" 
ON public.transacoes_conciliadas 
FOR ALL 
TO anon, service_role 
USING (false);

-- 3. Fix fluxo_caixa table RLS policies
DROP POLICY IF EXISTS "Users can create their own cash flow records" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Users can delete their own cash flow records" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Users can update their own cash flow records" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Users can view their own cash flow records" ON public.fluxo_caixa;

CREATE POLICY "authenticated_users_manage_own_cash_flow" 
ON public.fluxo_caixa 
FOR ALL 
TO authenticated 
USING (
  (auth.uid() = user_id) OR 
  (company_id IN (
    SELECT id FROM public.companies 
    WHERE user_id = auth.uid()
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (company_id IN (
    SELECT id FROM public.companies 
    WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "deny_anonymous_access_cash_flow" 
ON public.fluxo_caixa 
FOR ALL 
TO anon, service_role 
USING (false);

-- 4. Fix painel_mensal table RLS policies
DROP POLICY IF EXISTS "Users can insert their own monthly panel data" ON public.painel_mensal;
DROP POLICY IF EXISTS "Users can update their own monthly panel data" ON public.painel_mensal;
DROP POLICY IF EXISTS "Users can view their own monthly panel data" ON public.painel_mensal;

CREATE POLICY "authenticated_users_view_own_monthly_panel" 
ON public.painel_mensal 
FOR SELECT 
TO authenticated 
USING (auth.uid() = usuario_id);

CREATE POLICY "authenticated_users_insert_own_monthly_panel" 
ON public.painel_mensal 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "authenticated_users_update_own_monthly_panel" 
ON public.painel_mensal 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "deny_anonymous_access_monthly_panel" 
ON public.painel_mensal 
FOR ALL 
TO anon, service_role 
USING (false);

-- 5. Fix categorias_usuario table RLS policies
DROP POLICY IF EXISTS "Usuario so acessa suas categorias" ON public.categorias_usuario;

CREATE POLICY "authenticated_users_manage_own_categories" 
ON public.categorias_usuario 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deny_anonymous_access_categories" 
ON public.categorias_usuario 
FOR ALL 
TO anon, service_role 
USING (false);

-- 6. Fix password_history table RLS policies
DROP POLICY IF EXISTS "Users can manage their own password history" ON public.password_history;

CREATE POLICY "authenticated_users_manage_own_password_history" 
ON public.password_history 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deny_anonymous_access_password_history" 
ON public.password_history 
FOR ALL 
TO anon, service_role 
USING (false);

-- Add security documentation comments
COMMENT ON TABLE public.companies IS 'Company data with enhanced RLS security - only authenticated users can access their own company data';
COMMENT ON TABLE public.transacoes_conciliadas IS 'Transaction data with enhanced RLS security - only authenticated users can access their own or company transactions';
COMMENT ON TABLE public.fluxo_caixa IS 'Cash flow data with enhanced RLS security - only authenticated users can access their own or company cash flow';
COMMENT ON TABLE public.painel_mensal IS 'Monthly panel data with enhanced RLS security - only authenticated users can access their own data';
COMMENT ON TABLE public.categorias_usuario IS 'User categories with enhanced RLS security - only authenticated users can access their own categories';
COMMENT ON TABLE public.password_history IS 'Password history with enhanced RLS security - only authenticated users can access their own password history';