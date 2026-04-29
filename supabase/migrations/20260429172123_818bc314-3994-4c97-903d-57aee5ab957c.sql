ALTER TABLE public.fluxo_caixa
  DROP CONSTRAINT IF EXISTS fk_fluxo_caixa_transacao;

ALTER TABLE public.fluxo_caixa
  ADD CONSTRAINT fk_fluxo_caixa_transacao
  FOREIGN KEY (transacao_origem_id)
  REFERENCES public.transacoes_conciliadas(id)
  ON DELETE CASCADE;