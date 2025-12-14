import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

interface CategoryTotal {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
}

export function usePersonalDashboard(selectedMonth?: string) {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  // Fetch all transactions for the year for the chart
  const { data: yearlyTransactions, isLoading: yearlyLoading } = useQuery({
    queryKey: ['personal-transactions-yearly', user?.id, currentYear],
    queryFn: async () => {
      if (!user) return [];

      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from('personal_transactions')
        .select(`
          *,
          category:personal_categories(*)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch transactions for the selected month
  const { data: monthlyTransactions, isLoading: monthlyLoading } = useQuery({
    queryKey: ['personal-transactions-month', user?.id, selectedMonth],
    queryFn: async () => {
      if (!user || !selectedMonth) return [];

      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('personal_transactions')
        .select(`
          *,
          category:personal_categories(*)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!selectedMonth,
  });

  // Calculate monthly totals for the selected month
  const monthlyTotals = useMemo(() => {
    if (!monthlyTransactions) return { income: 0, expense: 0, balance: 0 };

    const totals = monthlyTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );

    return {
      ...totals,
      balance: totals.income - totals.expense
    };
  }, [monthlyTransactions]);

  // Calculate top categories by income and expense
  const categoryRankings = useMemo(() => {
    if (!monthlyTransactions) return { topIncome: [], topExpense: [] };

    const incomeByCategory: Record<string, CategoryTotal> = {};
    const expenseByCategory: Record<string, CategoryTotal> = {};

    monthlyTransactions.forEach((t) => {
      const categoryId = t.category_id || 'uncategorized';
      const categoryName = t.category?.name || 'Sem categoria';
      const categoryColor = t.category?.color || '#6B7280';
      const amount = Number(t.amount);

      if (t.type === 'income') {
        if (!incomeByCategory[categoryId]) {
          incomeByCategory[categoryId] = {
            categoryId,
            categoryName,
            categoryColor,
            total: 0,
            count: 0
          };
        }
        incomeByCategory[categoryId].total += amount;
        incomeByCategory[categoryId].count += 1;
      } else {
        if (!expenseByCategory[categoryId]) {
          expenseByCategory[categoryId] = {
            categoryId,
            categoryName,
            categoryColor,
            total: 0,
            count: 0
          };
        }
        expenseByCategory[categoryId].total += amount;
        expenseByCategory[categoryId].count += 1;
      }
    });

    const topIncome = Object.values(incomeByCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topExpense = Object.values(expenseByCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { topIncome, topExpense };
  }, [monthlyTransactions]);

  // Calculate monthly evolution data for the chart
  const monthlyEvolution = useMemo(() => {
    const months: MonthlyData[] = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 12; i++) {
      months.push({
        month: `${currentYear}-${String(i + 1).padStart(2, '0')}`,
        monthLabel: monthNames[i],
        income: 0,
        expense: 0
      });
    }

    if (yearlyTransactions) {
      yearlyTransactions.forEach((t) => {
        const date = new Date(t.transaction_date);
        const monthIndex = date.getMonth();
        const amount = Number(t.amount);

        if (t.type === 'income') {
          months[monthIndex].income += amount;
        } else {
          months[monthIndex].expense += amount;
        }
      });
    }

    return months;
  }, [yearlyTransactions, currentYear]);

  return {
    monthlyTotals,
    categoryRankings,
    monthlyEvolution,
    isLoading: yearlyLoading || monthlyLoading,
  };
}
