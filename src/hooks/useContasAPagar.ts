import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ContaTipo = 'fixa' | 'variavel';
export type ContaRecorrencia = 'unica' | 'mensal' | 'parcelada';
export type ContaStatus = 'pendente' | 'pago';

export interface ContaAPagar {
  id: string;
  user_id: string;
  company_id: string | null;
  nome: string;
  fornecedor: string | null;
  categoria: string | null;
  valor: number;
  data_vencimento: string;
  tipo: ContaTipo;
  recorrencia: ContaRecorrencia;
  parcelas_total: number | null;
  parcela_atual: number | null;
  status: ContaStatus;
  data_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContaAPagarInput {
  nome: string;
  fornecedor?: string;
  categoria?: string;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  tipo: ContaTipo;
  recorrencia: ContaRecorrencia;
  parcelas_total?: number;
  observacoes?: string;
}

// Adiciona meses a uma data YYYY-MM-DD preservando o dia, sem usar Date timezone
function addMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const total = (y * 12 + (m - 1)) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  // Ajustar dia caso o mês de destino não tenha aquele dia
  const lastDay = new Date(ny, nm, 0).getDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${String(nm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
}

export const useContasAPagar = (selectedMonth?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contas = [], isLoading, error } = useQuery({
    queryKey: ['contas-a-pagar', user?.id, selectedMonth ?? 'all'],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('user_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (selectedMonth && selectedMonth !== 'all') {
        const start = `${selectedMonth}-01`;
        const end = addMonthsISO(start, 1);
        query = query.gte('data_vencimento', start).lt('data_vencimento', end);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContaAPagar[];
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  // Gera lançamentos previstos em fluxo_caixa para contas FIXAS
  const syncFluxoCaixa = async (conta: ContaAPagar) => {
    if (!user?.id) return;
    if (conta.tipo !== 'fixa') return;

    const monthsToProject = conta.recorrencia === 'mensal' ? 12 : 1;
    const rows = [] as any[];
    for (let i = 0; i < monthsToProject; i++) {
      rows.push({
        user_id: user.id,
        company_id: conta.company_id,
        valor: Number(conta.valor),
        data_competencia: addMonthsISO(conta.data_vencimento, i),
        tipo: 'saida',
        descricao: `[Conta Fixa] ${conta.nome}`,
        categoria: conta.categoria || 'Contas Fixas',
        transacao_origem_id: conta.id,
      });
    }
    // Limpa lançamentos anteriores dessa conta e reinsere
    await supabase.from('fluxo_caixa').delete().eq('transacao_origem_id', conta.id);
    if (rows.length > 0) {
      await supabase.from('fluxo_caixa').insert(rows);
    }
  };

  const createConta = useMutation({
    mutationFn: async (input: ContaAPagarInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Para parceladas, criamos N contas individuais (uma por parcela)
      if (input.recorrencia === 'parcelada' && input.parcelas_total && input.parcelas_total > 1) {
        const rows = Array.from({ length: input.parcelas_total }, (_, i) => ({
          user_id: user.id,
          nome: input.nome,
          fornecedor: input.fornecedor || null,
          categoria: input.categoria || null,
          valor: input.valor,
          data_vencimento: addMonthsISO(input.data_vencimento, i),
          tipo: input.tipo,
          recorrencia: 'parcelada' as const,
          parcelas_total: input.parcelas_total,
          parcela_atual: i + 1,
          observacoes: input.observacoes || null,
          status: 'pendente' as const,
        }));
        const { data, error } = await supabase.from('contas_a_pagar').insert(rows).select();
        if (error) throw error;
        for (const c of (data || []) as ContaAPagar[]) {
          await syncFluxoCaixa(c);
        }
        return data;
      }

      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert({
          user_id: user.id,
          nome: input.nome,
          fornecedor: input.fornecedor || null,
          categoria: input.categoria || null,
          valor: input.valor,
          data_vencimento: input.data_vencimento,
          tipo: input.tipo,
          recorrencia: input.recorrencia,
          observacoes: input.observacoes || null,
          status: 'pendente',
        })
        .select()
        .single();
      if (error) throw error;
      await syncFluxoCaixa(data as ContaAPagar);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-a-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Conta a pagar criada!');
    },
    onError: (e: any) => {
      console.error(e);
      toast.error('Erro ao criar conta a pagar');
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, comprovante_url, data_pagamento }: { id: string; comprovante_url?: string; data_pagamento?: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const today = data_pagamento || new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update({ status: 'pago', data_pagamento: today, comprovante_url: comprovante_url || null })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-a-pagar'] });
      toast.success('Conta marcada como paga!');
    },
    onError: () => toast.error('Erro ao marcar como paga'),
  });

  const deleteConta = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      // remove projeções de fluxo de caixa atreladas
      await supabase.from('fluxo_caixa').delete().eq('transacao_origem_id', id);
      const { error } = await supabase
        .from('contas_a_pagar')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-a-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Conta removida');
    },
    onError: () => toast.error('Erro ao remover conta'),
  });

  const uploadComprovante = async (contaId: string, file: File): Promise<string> => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${contaId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('contas-comprovantes').upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const totalMes = contas.reduce((s, c) => s + Number(c.valor), 0);
  const totalPago = contas.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.valor), 0);
  const totalPendente = totalMes - totalPago;

  return {
    contas,
    isLoading,
    error,
    totalMes,
    totalPago,
    totalPendente,
    createConta,
    markAsPaid,
    deleteConta,
    uploadComprovante,
  };
};
