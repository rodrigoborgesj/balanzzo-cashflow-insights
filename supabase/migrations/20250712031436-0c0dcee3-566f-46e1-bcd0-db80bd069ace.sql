-- Modificar a tabela companies para suportar múltiplas empresas por usuário
-- Remover a constraint única do CNPJ temporariamente
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_cnpj_key;

-- Adicionar campos para holdings
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_holding BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS holding_parent_id UUID REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar constraint única composta para CNPJ por usuário (permite mesmo CNPJ para usuários diferentes)
CREATE UNIQUE INDEX IF NOT EXISTS companies_cnpj_user_unique ON public.companies(cnpj, user_id);

-- Criar tabela para configurações de holdings
CREATE TABLE IF NOT EXISTS public.holding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_holding_enabled BOOLEAN DEFAULT false,
  consolidation_view_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.holding_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para holding_settings
CREATE POLICY "Users can view their own holding settings" 
ON public.holding_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own holding settings" 
ON public.holding_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holding settings" 
ON public.holding_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at na tabela holding_settings
CREATE TRIGGER update_holding_settings_updated_at
  BEFORE UPDATE ON public.holding_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para dados financeiros consolidados (mock data para exemplo)
CREATE TABLE IF NOT EXISTS public.financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  revenue DECIMAL(15,2) DEFAULT 0,
  expenses DECIMAL(15,2) DEFAULT 0,
  profit DECIMAL(15,2) DEFAULT 0,
  cash_flow DECIMAL(15,2) DEFAULT 0,
  type TEXT DEFAULT 'monthly' CHECK (type IN ('daily', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, date, type)
);

-- Habilitar RLS na tabela financial_data
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;

-- Políticas para financial_data (através da empresa)
CREATE POLICY "Users can view their companies financial data" 
ON public.financial_data FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.companies c 
    WHERE c.id = company_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their companies financial data" 
ON public.financial_data FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c 
    WHERE c.id = company_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their companies financial data" 
ON public.financial_data FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.companies c 
    WHERE c.id = company_id AND c.user_id = auth.uid()
  )
);

-- Trigger para updated_at na tabela financial_data
CREATE TRIGGER update_financial_data_updated_at
  BEFORE UPDATE ON public.financial_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();