-- Criar tabela para fluxo de caixa
CREATE TABLE public.fluxo_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  data_competencia DATE NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria VARCHAR(100),
  descricao TEXT,
  valor NUMERIC(14, 2) NOT NULL,
  transacao_origem_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own cash flow records" 
ON public.fluxo_caixa 
FOR SELECT 
USING ((auth.uid() = user_id) OR (company_id IN ( SELECT companies.id FROM companies WHERE (companies.user_id = auth.uid()))));

CREATE POLICY "Users can create their own cash flow records" 
ON public.fluxo_caixa 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR (company_id IN ( SELECT companies.id FROM companies WHERE (companies.user_id = auth.uid()))));

CREATE POLICY "Users can update their own cash flow records" 
ON public.fluxo_caixa 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (company_id IN ( SELECT companies.id FROM companies WHERE (companies.user_id = auth.uid()))));

CREATE POLICY "Users can delete their own cash flow records" 
ON public.fluxo_caixa 
FOR DELETE 
USING ((auth.uid() = user_id) OR (company_id IN ( SELECT companies.id FROM companies WHERE (companies.user_id = auth.uid()))));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fluxo_caixa_updated_at
BEFORE UPDATE ON public.fluxo_caixa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint
ALTER TABLE public.fluxo_caixa 
ADD CONSTRAINT fk_fluxo_caixa_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Add foreign key constraint to transacao_origem for reference
ALTER TABLE public.fluxo_caixa 
ADD CONSTRAINT fk_fluxo_caixa_transacao 
FOREIGN KEY (transacao_origem_id) REFERENCES public.transacoes_conciliadas(id);

-- Create indexes for better performance
CREATE INDEX idx_fluxo_caixa_company_data ON public.fluxo_caixa(company_id, data_competencia);
CREATE INDEX idx_fluxo_caixa_user_data ON public.fluxo_caixa(user_id, data_competencia);
CREATE INDEX idx_fluxo_caixa_tipo ON public.fluxo_caixa(tipo);
CREATE INDEX idx_fluxo_caixa_categoria ON public.fluxo_caixa(categoria);