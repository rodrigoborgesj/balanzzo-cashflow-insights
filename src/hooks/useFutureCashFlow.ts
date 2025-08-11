import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FutureTransaction {
  id: string;
  user_id: string;
  data_competencia: string;
  tipo: 'entrada' | 'saida';
  categoria: string | null;
  descricao: string | null;
  valor: number;
  created_at: string;
}

export interface ProjectionData {
  period: string;
  projected: number;
  category: string;
  description?: string;
}

export function useFutureCashFlow() {
  const [futureTransactions, setFutureTransactions] = useState<FutureTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load future transactions from fluxo_caixa table
  const loadFutureTransactions = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('fluxo_caixa')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_competencia', today)
        .order('data_competencia', { ascending: true });

      if (error) {
        console.error('Erro ao carregar transações futuras:', error);
        return;
      }

      const futureData: FutureTransaction[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        data_competencia: item.data_competencia,
        tipo: item.tipo as 'entrada' | 'saida',
        categoria: item.categoria,
        descricao: item.descricao,
        valor: item.valor,
        created_at: item.created_at
      }));
      
      setFutureTransactions(futureData);
    } catch (error) {
      console.error('Erro ao carregar transações futuras:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFutureTransactions();
  }, [loadFutureTransactions]);

  // Generate income projections data
  const getIncomeProjections = useCallback((type: 'annual' | 'monthly' = 'annual'): ProjectionData[] => {
    const incomeTransactions = futureTransactions.filter(t => t.tipo === 'entrada');
    
    if (type === 'annual') {
      // Group by month for next 12 months
      const monthlyData = new Map<string, number>();
      
      incomeTransactions.forEach(transaction => {
        const date = new Date(transaction.data_competencia);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, monthlyData.get(monthKey)! + transaction.valor);
        } else {
          monthlyData.set(monthKey, transaction.valor);
        }
      });

      return Array.from(monthlyData.entries()).map(([monthKey, valor]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        return {
          period: monthName,
          projected: valor,
          category: 'Receitas Futuras',
          description: `Projeção de receitas para ${monthName}`
        };
      }).slice(0, 12);
    } else {
      // Daily projections for current month
      const dailyData = new Map<string, number>();
      
      incomeTransactions.forEach(transaction => {
        const date = new Date(transaction.data_competencia);
        const dayKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        if (dailyData.has(dayKey)) {
          dailyData.set(dayKey, dailyData.get(dayKey)! + transaction.valor);
        } else {
          dailyData.set(dayKey, transaction.valor);
        }
      });

      return Array.from(dailyData.entries()).map(([day, valor]) => ({
        period: day,
        projected: valor,
        category: 'Receitas Futuras',
        description: `Projeção de receitas para ${day}`
      }));
    }
  }, [futureTransactions]);

  // Generate expense projections data
  const getExpenseProjections = useCallback((type: 'annual' | 'monthly' = 'annual'): ProjectionData[] => {
    const expenseTransactions = futureTransactions.filter(t => t.tipo === 'saida');
    
    if (type === 'annual') {
      // Group by month for next 12 months
      const monthlyData = new Map<string, number>();
      
      expenseTransactions.forEach(transaction => {
        const date = new Date(transaction.data_competencia);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, monthlyData.get(monthKey)! + transaction.valor);
        } else {
          monthlyData.set(monthKey, transaction.valor);
        }
      });

      return Array.from(monthlyData.entries()).map(([monthKey, valor]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        return {
          period: monthName,
          projected: valor,
          category: 'Despesas Futuras',
          description: `Projeção de despesas para ${monthName}`
        };
      }).slice(0, 12);
    } else {
      // Daily projections for current month
      const dailyData = new Map<string, number>();
      
      expenseTransactions.forEach(transaction => {
        const date = new Date(transaction.data_competencia);
        const dayKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        if (dailyData.has(dayKey)) {
          dailyData.set(dayKey, dailyData.get(dayKey)! + transaction.valor);
        } else {
          dailyData.set(dayKey, transaction.valor);
        }
      });

      return Array.from(dailyData.entries()).map(([day, valor]) => ({
        period: day,
        projected: valor,
        category: 'Despesas Futuras',
        description: `Projeção de despesas para ${day}`
      }));
    }
  }, [futureTransactions]);

  return {
    futureTransactions,
    isLoading,
    loadFutureTransactions,
    getIncomeProjections,
    getExpenseProjections,
    hasData: futureTransactions.length > 0
  };
}