import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useModule } from '@/contexts/ModuleContext';
import type { Transaction } from './useConciliacao';

export function useAnnualCashFlow(year: string) {
  const { user } = useAuth();
  const { currentContext } = useModule();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['annual-cash-flow', user?.id, currentContext, year],
    enabled: !!user?.id && currentContext === 'company' && /^\d{4}$/.test(year),
    staleTime: 0,
    queryFn: async () => {
      if (!user?.id || currentContext !== 'company') return [];
      const rows: Transaction[] = [];
      const nextYear = String(Number(year) + 1);
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('transacoes_conciliadas')
          .select('*').eq('user_id', user.id).eq('status_conciliacao', true)
          .or(`and(mes_referencia.gte.${year}-01-01,mes_referencia.lt.${nextYear}-01-01),and(mes_referencia.is.null,data_transacao.gte.${year}-01-01,data_transacao.lt.${nextYear}-01-01)`)
          .order('id').range(offset, offset + 999);
        if (error) throw error;
        rows.push(...(data || []) as Transaction[]);
        if ((data || []).length < 1000) break;
      }
      return rows;
    },
  });
  useEffect(() => {
    if (!user?.id || currentContext !== 'company') return;
    const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['annual-cash-flow', user.id] }); };
    const channel = supabase.channel(`annual-cash-flow-${user.id}-${crypto.randomUUID()}`)
      .on('postgres_changes', {event:'*',schema:'public',table:'transacoes_conciliadas',filter:`user_id=eq.${user.id}`}, refresh).subscribe();
    window.addEventListener('transactionsUpdated', refresh);
    return () => { void supabase.removeChannel(channel); window.removeEventListener('transactionsUpdated', refresh); };
  }, [user?.id, currentContext, queryClient]);
  return query;
}