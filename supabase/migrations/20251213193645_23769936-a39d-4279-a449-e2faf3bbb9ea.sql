-- =============================================
-- BALANZZO: MÓDULOS PJ (EMPRESA) E PF (PESSOAL)
-- =============================================

-- 1. Enum para tipo de plano de assinatura
CREATE TYPE public.subscription_type AS ENUM ('company', 'personal');

-- 2. Adicionar coluna de tipo na tabela de planos
ALTER TABLE public.subscription_plans 
ADD COLUMN subscription_type public.subscription_type NOT NULL DEFAULT 'company';

-- 3. Adicionar coluna de tipo na tabela de assinaturas
ALTER TABLE public.subscriptions 
ADD COLUMN subscription_type public.subscription_type NOT NULL DEFAULT 'company';

-- 4. Tabela de perfis pessoais (PF) - separada dos perfis de empresa
CREATE TABLE public.personal_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Endereço completo
  address_zip_code TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  
  -- Controle
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabela de categorias pessoais (isolada das categorias empresariais)
CREATE TABLE public.personal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, name)
);

-- 6. Tabela de transações pessoais (isolada das transações empresariais)
CREATE TABLE public.personal_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Dados da transação
  transaction_date DATE NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.personal_categories(id) ON DELETE SET NULL,
  
  -- Origem e controle
  source_file TEXT,
  hash_transaction TEXT,
  reconciled BOOLEAN DEFAULT false,
  reference_month DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabela de sessão de contexto do usuário
CREATE TABLE public.user_session_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_context public.subscription_type NOT NULL DEFAULT 'company',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.personal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_session_context ENABLE ROW LEVEL SECURITY;

-- Personal Profiles
CREATE POLICY "Users can view own personal profile"
ON public.personal_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal profile"
ON public.personal_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal profile"
ON public.personal_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to personal profiles"
ON public.personal_profiles FOR ALL
USING (false);

-- Personal Categories
CREATE POLICY "Users can manage own personal categories"
ON public.personal_categories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to personal categories"
ON public.personal_categories FOR ALL
USING (false);

-- Personal Transactions
CREATE POLICY "Users can manage own personal transactions"
ON public.personal_transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to personal transactions"
ON public.personal_transactions FOR ALL
USING (false);

-- User Session Context
CREATE POLICY "Users can manage own session context"
ON public.user_session_context FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to session context"
ON public.user_session_context FOR ALL
USING (false);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Função para verificar se usuário tem assinatura ativa de um tipo específico
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID, p_type public.subscription_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.subscription_type = p_type
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

-- Função para verificar se perfil pessoal está completo
CREATE OR REPLACE FUNCTION public.is_personal_profile_complete(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT profile_complete FROM public.personal_profiles WHERE user_id = p_user_id),
    false
  );
$$;

-- Função para obter contexto atual do usuário
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID)
RETURNS public.subscription_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT current_context FROM public.user_session_context WHERE user_id = p_user_id),
    'company'::public.subscription_type
  );
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_personal_profiles_updated_at
BEFORE UPDATE ON public.personal_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_categories_updated_at
BEFORE UPDATE ON public.personal_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_transactions_updated_at
BEFORE UPDATE ON public.personal_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_session_context_updated_at
BEFORE UPDATE ON public.user_session_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_personal_transactions_user_date 
ON public.personal_transactions(user_id, transaction_date);

CREATE INDEX idx_personal_transactions_category 
ON public.personal_transactions(category_id);

CREATE INDEX idx_personal_categories_user 
ON public.personal_categories(user_id);

CREATE INDEX idx_subscriptions_type 
ON public.subscriptions(subscription_type);

CREATE INDEX idx_subscription_plans_type 
ON public.subscription_plans(subscription_type);