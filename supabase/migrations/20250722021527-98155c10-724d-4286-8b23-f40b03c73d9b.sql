-- Enable realtime for transacoes_conciliadas table
ALTER TABLE public.transacoes_conciliadas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_conciliadas;

-- Enable realtime for fluxo_caixa table  
ALTER TABLE public.fluxo_caixa REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fluxo_caixa;