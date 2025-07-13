
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FinancialData {
  id: string;
  company_id: string;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  cash_flow: number;
  type: string;
}

export interface ConsolidatedFinancialData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalCashFlow: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export function useFinancialData() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedFinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados financeiros das empresas do usuário
      const { data, error } = await supabase
        .from('financial_data')
        .select(`
          *,
          companies (
            company_name,
            user_id
          )
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching financial data:', error);
        return;
      }

      const financialRecords = data || [];
      setFinancialData(financialRecords);

      // Processar dados consolidados
      const consolidated = processConsolidatedData(financialRecords);
      setConsolidatedData(consolidated);

    } catch (error) {
      console.error('Error in fetchFinancialData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processConsolidatedData = (data: any[]): ConsolidatedFinancialData => {
    // Calcular totais
    const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalExpenses = data.reduce((sum, item) => sum + (item.expenses || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (item.profit || 0), 0);
    const totalCashFlow = data.reduce((sum, item) => sum + (item.cash_flow || 0), 0);

    // Agrupar por mês
    const monthlyGroups: { [key: string]: any } = {};
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          profit: 0,
          cashFlow: 0
        };
      }
      
      monthlyGroups[monthKey].revenue += item.revenue || 0;
      monthlyGroups[monthKey].expenses += item.expenses || 0;
      monthlyGroups[monthKey].profit += item.profit || 0;
      monthlyGroups[monthKey].cashFlow += item.cash_flow || 0;
    });

    const monthlyData = Object.values(monthlyGroups).slice(0, 6); // Últimos 6 meses

    // Simular categorias de despesas (pode ser expandido com dados reais)
    const expensesByCategory = [
      { category: "Pessoal", amount: totalExpenses * 0.4, percentage: 40 },
      { category: "Operacional", amount: totalExpenses * 0.25, percentage: 25 },
      { category: "Administrativo", amount: totalExpenses * 0.2, percentage: 20 },
      { category: "Impostos", amount: totalExpenses * 0.1, percentage: 10 },
      { category: "Outros", amount: totalExpenses * 0.05, percentage: 5 },
    ];

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalCashFlow,
      monthlyData,
      expensesByCategory
    };
  };

  const addFinancialRecord = async (record: Omit<FinancialData, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('financial_data')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Error adding financial record:', error);
        return { error };
      }

      // Refresh data
      await fetchFinancialData();
      return { data };
    } catch (error) {
      console.error('Error in addFinancialRecord:', error);
      return { error };
    }
  };

  return {
    financialData,
    consolidatedData,
    isLoading,
    addFinancialRecord,
    refreshData: fetchFinancialData
  };
}
