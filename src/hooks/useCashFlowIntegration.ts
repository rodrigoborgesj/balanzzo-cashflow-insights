import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/hooks/useConciliacao';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Carregar transações conciliadas do mês
  const loadTransactions = useCallback(async () => {
    if (!user?.id || !selectedMonth) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status_conciliacao', true) // Apenas transações conciliadas
        .gte('data_transacao', `${selectedMonth}-01`)
        .lt('data_transacao', `${selectedMonth}-32`)
        .order('data_transacao', { ascending: true });

      if (error) {
        console.error('Erro ao carregar transações:', error);
        return;
      }

      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedMonth]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Calcular resumo do fluxo de caixa
  const summary: CashFlowSummary = {
    totalEntradas: transactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0),
    totalSaidas: Math.abs(transactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0)),
    saldoLiquido: transactions.reduce((sum, t) => sum + t.valor, 0),
    transacoesCount: transactions.length
  };

  // Resumo por categoria
  const categorySummary: CategorySummary[] = transactions.reduce((acc, transaction) => {
    const categoria = transaction.categoria_final || transaction.categoria_sugerida || 'Sem categoria';
    const existing = acc.find(item => item.categoria === categoria && item.tipo === transaction.tipo);
    
    if (existing) {
      existing.valor += Math.abs(transaction.valor);
      existing.count += 1;
    } else {
      acc.push({
        categoria,
        tipo: transaction.tipo,
        valor: Math.abs(transaction.valor),
        count: 1,
        percentual: 0 // Será calculado depois
      });
    }
    
    return acc;
  }, [] as CategorySummary[]);

  // Calcular percentuais
  const totalGeral = summary.totalEntradas + summary.totalSaidas;
  categorySummary.forEach(item => {
    item.percentual = totalGeral > 0 ? (item.valor / totalGeral) * 100 : 0;
  });

  // Fluxo diário
  const dailyFlow: DailyFlow[] = transactions.reduce((acc, transaction) => {
    const data = transaction.data_transacao;
    const existing = acc.find(item => item.data === data);
    
    if (existing) {
      if (transaction.tipo === 'entrada') {
        existing.entradas += transaction.valor;
      } else {
        existing.saidas += Math.abs(transaction.valor);
      }
      existing.saldo = existing.entradas - existing.saidas;
    } else {
      const entradas = transaction.tipo === 'entrada' ? transaction.valor : 0;
      const saidas = transaction.tipo === 'saida' ? Math.abs(transaction.valor) : 0;
      
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

  // Transações mais recentes
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
    .slice(0, 10);

  // Dados para gráficos
  const chartData = dailyFlow.map(day => ({
    data: new Date(day.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    entradas: day.entradas,
    saidas: day.saidas,
    saldo: day.saldoAcumulado
  }));

  return {
    transactions,
    summary,
    categorySummary: categorySummary.sort((a, b) => b.valor - a.valor),
    dailyFlow,
    recentTransactions,
    chartData,
    isLoading,
    loadTransactions,
    hasData: transactions.length > 0
  };
}