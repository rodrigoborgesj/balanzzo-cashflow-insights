import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type PainelMensalRow = Database['public']['Tables']['painel_mensal']['Row'];

export interface PainelMensal {
  id: string;
  usuario_id: string;
  ano: number;
  mes: number;
  total_entradas: number;
  total_saidas: number;
  categoria_gastos: Record<string, number>;
  categoria_receitas: Record<string, number>;
  dados_brutos: any[];
  insights: {
    insights: string[];
    gerado_em: string;
  };
  criado_em: string;
  atualizado_em: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyData {
  mes: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export function useDashboard() {
  const [painelData, setPainelData] = useState<PainelMensal[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Função para converter dados do banco para o formato esperado
  const convertPainelData = (rawData: PainelMensalRow[]): PainelMensal[] => {
    return rawData.map(item => ({
      id: item.id,
      usuario_id: item.usuario_id,
      ano: item.ano,
      mes: item.mes,
      total_entradas: item.total_entradas,
      total_saidas: item.total_saidas,
      categoria_gastos: (item.categoria_gastos as Record<string, number>) || {},
      categoria_receitas: (item.categoria_receitas as Record<string, number>) || {},
      dados_brutos: (item.dados_brutos as any[]) || [],
      insights: (item.insights as { insights: string[]; gerado_em: string }) || { insights: [], gerado_em: '' },
      criado_em: item.criado_em,
      atualizado_em: item.atualizado_em
    }));
  };

  // Carregar dados do painel mensal
  const loadDashboardData = useCallback(async (monthFilter?: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('painel_mensal')
        .select('*')
        .eq('usuario_id', user.id);

      // Se especificado um mês, filtrar por ele, senão buscar últimos 12 meses
      if (monthFilter) {
        const [ano, mes] = monthFilter.split('-').map(Number);
        query = query.eq('ano', ano).eq('mes', mes);
      } else {
        // Buscar últimos 12 meses
        const currentDate = new Date();
        const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
        query = query
          .gte('ano', twelveMonthsAgo.getFullYear())
          .order('ano', { ascending: false })
          .order('mes', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        return;
      }

      const convertedData = convertPainelData(data || []);
      setPainelData(convertedData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Calcular dados do mês atual
  const currentMonthData = useCallback(() => {
    const [ano, mes] = selectedMonth.split('-').map(Number);
    const current = painelData.find(p => p.ano === ano && p.mes === mes);
    
    return current || {
      total_entradas: 0,
      total_saidas: 0,
      categoria_gastos: {},
      categoria_receitas: {},
      insights: { insights: [], gerado_em: '' }
    };
  }, [painelData, selectedMonth]);

  // Preparar dados para gráfico de pizza (gastos por categoria)
  const expenseChartData = useCallback((): ChartData[] => {
    const current = currentMonthData();
    const data = Object.entries(current.categoria_gastos || {})
      .map(([categoria, valor]) => ({
        name: categoria,
        value: Number(valor),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      }))
      .sort((a, b) => b.value - a.value);
    
    return data;
  }, [currentMonthData]);

  // Preparar dados para gráfico de pizza (receitas por categoria)
  const incomeChartData = useCallback((): ChartData[] => {
    const current = currentMonthData();
    const data = Object.entries(current.categoria_receitas || {})
      .map(([categoria, valor]) => ({
        name: categoria,
        value: Number(valor),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      }))
      .sort((a, b) => b.value - a.value);
    
    return data;
  }, [currentMonthData]);

  // Preparar dados para gráfico mensal (linha/coluna)
  const monthlyChartData = useCallback((): MonthlyData[] => {
    const data = painelData
      .slice(0, 12) // Últimos 12 meses
      .reverse() // Ordem cronológica
      .map(item => {
        const monthName = new Date(item.ano, item.mes - 1).toLocaleDateString('pt-BR', { 
          month: 'short',
          year: '2-digit'
        });
        
        return {
          mes: monthName,
          entradas: Number(item.total_entradas),
          saidas: Number(item.total_saidas),
          saldo: Number(item.total_entradas) - Number(item.total_saidas)
        };
      });
    
    return data;
  }, [painelData]);

  // Calcular indicadores principais (KPIs)
  const kpiData = useCallback(() => {
    const current = currentMonthData();
    const totalEntradas = Number(current.total_entradas || 0);
    const totalSaidas = Number(current.total_saidas || 0);
    const saldoLiquido = totalEntradas - totalSaidas;
    
    // Calcular comparação com mês anterior
    const [ano, mes] = selectedMonth.split('-').map(Number);
    let mesAnterior = mes - 1;
    let anoAnterior = ano;
    if (mesAnterior === 0) {
      mesAnterior = 12;
      anoAnterior = ano - 1;
    }
    
    const anterior = painelData.find(p => p.ano === anoAnterior && p.mes === mesAnterior);
    const saldoAnterior = anterior ? Number(anterior.total_entradas) - Number(anterior.total_saidas) : 0;
    
    const variacaoSaldo = saldoAnterior > 0 ? ((saldoLiquido - saldoAnterior) / saldoAnterior) * 100 : 0;
    const variacaoEntradas = anterior && anterior.total_entradas > 0 
      ? ((totalEntradas - Number(anterior.total_entradas)) / Number(anterior.total_entradas)) * 100 
      : 0;
    const variacaoSaidas = anterior && anterior.total_saidas > 0 
      ? ((totalSaidas - Number(anterior.total_saidas)) / Number(anterior.total_saidas)) * 100 
      : 0;

    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido,
      variacaoSaldo,
      variacaoEntradas,
      variacaoSaidas,
      insights: current.insights?.insights || []
    };
  }, [currentMonthData, painelData, selectedMonth]);

  // Formatar moeda brasileira
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  // Verificar se há dados disponíveis
  const hasData = painelData.length > 0;

  // Effect para carregar dados quando o componente monta ou o usuário muda
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, loadDashboardData]);

  return {
    painelData,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    hasData,
    currentMonthData: currentMonthData(),
    expenseChartData: expenseChartData(),
    incomeChartData: incomeChartData(),
    monthlyChartData: monthlyChartData(),
    kpiData: kpiData(),
    formatCurrency,
    loadDashboardData
  };
}