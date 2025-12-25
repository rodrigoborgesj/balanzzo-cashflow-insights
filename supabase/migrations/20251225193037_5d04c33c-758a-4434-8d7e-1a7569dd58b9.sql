-- Tabela para dívidas pessoais
CREATE TABLE public.personal_debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cartao', 'emprestimo', 'financiamento', 'parcelamento', 'outros')),
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'quitada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para dívidas
ALTER TABLE public.personal_debts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para dívidas
CREATE POLICY "Users can manage own debts" 
ON public.personal_debts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to debts" 
ON public.personal_debts 
FOR ALL 
USING (false);

-- Tabela para renegociações de dívidas
CREATE TABLE public.personal_debt_renegotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  debt_id UUID NOT NULL REFERENCES public.personal_debts(id) ON DELETE CASCADE,
  total_installments INTEGER NOT NULL,
  installment_amount NUMERIC NOT NULL,
  first_due_date DATE NOT NULL,
  total_renegotiated NUMERIC GENERATED ALWAYS AS (total_installments * installment_amount) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para renegociações
ALTER TABLE public.personal_debt_renegotiations ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para renegociações
CREATE POLICY "Users can manage own renegotiations" 
ON public.personal_debt_renegotiations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to renegotiations" 
ON public.personal_debt_renegotiations 
FOR ALL 
USING (false);

-- Tabela para entradas fixas mensais
CREATE TABLE public.personal_fixed_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para entradas fixas
ALTER TABLE public.personal_fixed_income ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para entradas fixas
CREATE POLICY "Users can manage own fixed income" 
ON public.personal_fixed_income 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to fixed income" 
ON public.personal_fixed_income 
FOR ALL 
USING (false);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_personal_debts_updated_at
BEFORE UPDATE ON public.personal_debts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_debt_renegotiations_updated_at
BEFORE UPDATE ON public.personal_debt_renegotiations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_fixed_income_updated_at
BEFORE UPDATE ON public.personal_fixed_income
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();