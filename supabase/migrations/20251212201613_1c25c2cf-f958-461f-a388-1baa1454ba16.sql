-- 1. Corrigir free_access_users - remover acesso público direto
-- A função has_free_access já existe e é SECURITY DEFINER, então podemos usá-la
-- Vamos remover a política que expõe todos os emails

DROP POLICY IF EXISTS "Anyone can check free access" ON public.free_access_users;

-- Criar política que só permite acesso via função RPC (ninguém pode SELECT diretamente)
CREATE POLICY "No direct access to free_access_users" 
ON public.free_access_users 
FOR SELECT 
USING (false);

-- 2. Corrigir payments - restringir UPDATE apenas para service role
DROP POLICY IF EXISTS "Only system can update payment status" ON public.payments;

-- Criar política que bloqueia UPDATE por usuários normais (apenas service role pode atualizar)
CREATE POLICY "Only service role can update payments" 
ON public.payments 
FOR UPDATE 
USING (false)
WITH CHECK (false);

-- 3. Corrigir email_logs - restringir INSERT para usuários autenticados apenas para seus próprios logs
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;

-- Criar política mais restritiva para INSERT
CREATE POLICY "Authenticated users can insert own email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Adicionar políticas explícitas de DENY para operações não permitidas

-- Negar INSERT/UPDATE/DELETE em free_access_users
CREATE POLICY "Deny insert on free_access_users" 
ON public.free_access_users 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Deny update on free_access_users" 
ON public.free_access_users 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny delete on free_access_users" 
ON public.free_access_users 
FOR DELETE 
USING (false);

-- Negar DELETE em payments
CREATE POLICY "Deny delete on payments" 
ON public.payments 
FOR DELETE 
USING (false);