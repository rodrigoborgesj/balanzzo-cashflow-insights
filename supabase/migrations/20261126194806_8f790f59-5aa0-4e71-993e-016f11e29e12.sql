ALTER TABLE public.transacoes_conciliadas
  ADD COLUMN IF NOT EXISTS metodo_pagamento text;

COMMENT ON COLUMN public.transacoes_conciliadas.metodo_pagamento IS 'Forma de pagamento identificada no extrato ou informada no lançamento (pix, cartao_credito, cartao_debito, boleto, dinheiro, transferencia, outros).';