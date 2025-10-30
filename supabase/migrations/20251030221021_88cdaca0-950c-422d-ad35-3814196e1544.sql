-- Create recurring transactions table
CREATE TABLE IF NOT EXISTS public.transacoes_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_origem_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID,
  tipo_recorrencia TEXT NOT NULL CHECK (tipo_recorrencia IN ('monthly', 'specific_month', 'custom')),
  intervalo_dias INTEGER,
  mes_especifico INTEGER CHECK (mes_especifico >= 1 AND mes_especifico <= 12),
  proximo_lancamento DATE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_custom_interval CHECK (
    (tipo_recorrencia = 'custom' AND intervalo_dias IS NOT NULL AND intervalo_dias > 0) OR
    (tipo_recorrencia != 'custom')
  ),
  CONSTRAINT valid_specific_month CHECK (
    (tipo_recorrencia = 'specific_month' AND mes_especifico IS NOT NULL) OR
    (tipo_recorrencia != 'specific_month')
  )
);

-- Enable Row Level Security
ALTER TABLE public.transacoes_recorrentes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "authenticated_users_manage_own_recurring_transactions"
ON public.transacoes_recorrentes
FOR ALL
USING (
  (auth.uid() = user_id) OR 
  (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

CREATE POLICY "deny_anonymous_access_recurring_transactions"
ON public.transacoes_recorrentes
FOR ALL
USING (false);

-- Create index for performance
CREATE INDEX idx_transacoes_recorrentes_user_id ON public.transacoes_recorrentes(user_id);
CREATE INDEX idx_transacoes_recorrentes_proximo_lancamento ON public.transacoes_recorrentes(proximo_lancamento) WHERE ativo = true;

-- Create trigger for updated_at
CREATE TRIGGER update_transacoes_recorrentes_updated_at
BEFORE UPDATE ON public.transacoes_recorrentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();