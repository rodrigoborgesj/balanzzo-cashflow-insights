-- Create the painel_mensal table for monthly dashboard data
CREATE TABLE public.painel_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL,
  total_entradas NUMERIC DEFAULT 0,
  total_saidas NUMERIC DEFAULT 0,
  categoria_gastos JSONB DEFAULT '{}',
  categoria_receitas JSONB DEFAULT '{}',
  dados_brutos JSONB,
  insights JSONB DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, ano, mes)
);

-- Enable RLS
ALTER TABLE public.painel_mensal ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own monthly panel data"
ON public.painel_mensal
FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own monthly panel data"
ON public.painel_mensal
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own monthly panel data"
ON public.painel_mensal
FOR UPDATE
USING (auth.uid() = usuario_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_painel_mensal_updated_at
BEFORE UPDATE ON public.painel_mensal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();