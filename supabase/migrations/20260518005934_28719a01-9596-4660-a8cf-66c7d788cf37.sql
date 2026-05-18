
-- Tabela contas_a_pagar
CREATE TABLE public.contas_a_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  nome TEXT NOT NULL,
  fornecedor TEXT,
  categoria TEXT,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixa','variavel')),
  recorrencia TEXT NOT NULL DEFAULT 'unica' CHECK (recorrencia IN ('unica','mensal','parcelada')),
  parcelas_total INTEGER,
  parcela_atual INTEGER,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  data_pagamento DATE,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_a_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_contas_a_pagar"
ON public.contas_a_pagar
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
  OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);

CREATE POLICY "deny_anonymous_contas_a_pagar"
ON public.contas_a_pagar
FOR ALL
TO anon, service_role
USING (false);

CREATE INDEX idx_contas_a_pagar_user_venc ON public.contas_a_pagar(user_id, data_vencimento);

CREATE TRIGGER update_contas_a_pagar_updated_at
BEFORE UPDATE ON public.contas_a_pagar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket privado para comprovantes
INSERT INTO storage.buckets (id, name, public) VALUES ('contas-comprovantes', 'contas-comprovantes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users_view_own_contas_comprovantes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contas-comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_upload_own_contas_comprovantes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contas-comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_update_own_contas_comprovantes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'contas-comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_delete_own_contas_comprovantes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contas-comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);
