import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/hooks/useConciliacao';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FluxoCaixaRecord {
  id: string;
  company_id: string | null;
  user_id: string;
  data_competencia: string;
  tipo: 'entrada' | 'saida';
  categoria: string | null;
  descricao: string | null;
  valor: number;
  transacao_origem_id: string | null;
  created_at: string;
}

export interface CashFlowSummary {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  transacoesCount: number;
}

export interface CategorySummary {
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  count: number;
  percentual: number;
}

export interface DailyFlow {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export function useCashFlowIntegration(selectedMonth: string) {
  const [fluxoData, setFluxoData] = useState<FluxoCaixaRecord[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Carregar dados do fluxo de caixa integrado
  const loadCashFlowData = useCallback(async () => {
    if (!user?.id || !selectedMonth) return;

    setIsLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      // Carregar dados do fluxo de caixa
      const { data: fluxoData, error: fluxoError } = await supabase
        .from('fluxo_caixa')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_competencia', startDate)
        .lte('data_competencia', endDate)
        .order('data_competencia', { ascending: true });

      if (fluxoError) {
        console.error('Erro ao carregar fluxo de caixa:', fluxoError);
        return;
      }

      setFluxoData((fluxoData || []) as FluxoCaixaRecord[]);

      // Carregar transações recentes para referência
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status_conciliacao', true)
        .gte('data_transacao', startDate)
        .lte('data_transacao', endDate)
        .order('data_transacao', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Erro ao carregar transações recentes:', transactionsError);
        return;
      }

      setRecentTransactions((transactionsData || []) as Transaction[]);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedMonth]);

  useEffect(() => {
    loadCashFlowData();
  }, [loadCashFlowData]);

  // Calcular resumo do fluxo de caixa baseado nos dados da tabela fluxo_caixa
  const summary: CashFlowSummary = {
    totalEntradas: fluxoData
      .filter(item => item.tipo === 'entrada')
      .reduce((sum, item) => sum + item.valor, 0),
    totalSaidas: fluxoData
      .filter(item => item.tipo === 'saida')
      .reduce((sum, item) => sum + item.valor, 0),
    saldoLiquido: fluxoData
      .filter(item => item.tipo === 'entrada')
      .reduce((sum, item) => sum + item.valor, 0) - 
      fluxoData
      .filter(item => item.tipo === 'saida')
      .reduce((sum, item) => sum + item.valor, 0),
    transacoesCount: fluxoData.length
  };

  // Resumo por categoria baseado nos dados do fluxo de caixa
  const categorySummary: CategorySummary[] = fluxoData.reduce((acc, item) => {
    const categoria = item.categoria || 'Sem categoria';
    const existing = acc.find(cat => cat.categoria === categoria && cat.tipo === item.tipo);
    
    if (existing) {
      existing.valor += item.valor;
      existing.count += 1;
    } else {
      acc.push({
        categoria,
        tipo: item.tipo,
        valor: item.valor,
        count: 1,
        percentual: 0 // Será calculado depois
      });
    }
    
    return acc;
  }, [] as CategorySummary[]);

  // Calcular percentuais por tipo
  categorySummary.forEach(item => {
    const total = item.tipo === 'entrada' ? summary.totalEntradas : summary.totalSaidas;
    item.percentual = total > 0 ? (item.valor / total) * 100 : 0;
  });

  // Fluxo diário baseado nos dados do fluxo de caixa
  const dailyFlow: DailyFlow[] = fluxoData.reduce((acc, item) => {
    const data = item.data_competencia;
    const existing = acc.find(day => day.data === data);
    
    if (existing) {
      if (item.tipo === 'entrada') {
        existing.entradas += item.valor;
      } else {
        existing.saidas += item.valor;
      }
      existing.saldo = existing.entradas - existing.saidas;
    } else {
      const entradas = item.tipo === 'entrada' ? item.valor : 0;
      const saidas = item.tipo === 'saida' ? item.valor : 0;
      
      acc.push({
        data,
        entradas,
        saidas,
        saldo: entradas - saidas,
        saldoAcumulado: 0 // Será calculado depois
      });
    }
    
    return acc;
  }, [] as DailyFlow[]);

  // Calcular saldo acumulado
  let saldoAcumulado = 0;
  dailyFlow.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  dailyFlow.forEach(day => {
    saldoAcumulado += day.saldo;
    day.saldoAcumulado = saldoAcumulado;
  });

  // Dados para gráficos
  const chartData = dailyFlow.map(day => ({
    data: new Date(day.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    entradas: day.entradas,
    saidas: day.saidas,
    saldo: day.saldoAcumulado
  }));

  return {
    fluxoData,
    summary,
    categorySummary: categorySummary.sort((a, b) => b.valor - a.valor),
    dailyFlow,
    recentTransactions,
    chartData,
    isLoading,
    loadCashFlowData,
    hasData: fluxoData.length > 0
  };
}