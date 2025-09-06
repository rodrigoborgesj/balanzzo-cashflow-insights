import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

// Query keys for React Query
const QUERY_KEYS = {
  dashboardData: (userId: string, monthFilter?: string) => 
    ['dashboard', userId, monthFilter].filter(Boolean),
  painelMensal: (userId: string, monthFilter?: string) => 
    ['painel-mensal', userId, monthFilter].filter(Boolean),
  transactions: (userId: string, monthFilter?: string) => 
    ['transactions', userId, monthFilter].filter(Boolean),
} as const;

export function useDashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate correlation ID for logging
  const correlationId = useMemo(() => 
    `dash-${Date.now()}-${Math.random().toString(36).substring(7)}`, []
  );

  // Função para converter dados do banco para o formato esperado
  const convertPainelData = useCallback((rawData: PainelMensalRow[]): PainelMensal[] => {
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
  }, []);

  // Função para calcular dados do dashboard a partir das transações conciliadas
  const calculateDashboardFromTransactions = useCallback(async (
    monthFilter?: string,
    signal?: AbortSignal
  ): Promise<PainelMensal[]> => {
    if (!user?.id) return [];

    try {
      console.log(`[${correlationId}] Calculating dashboard from transactions`, { 
        userId: user.id, 
        monthFilter 
      });

      let query = supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status_conciliacao', true);

      // Filter by month if specified
      if (monthFilter) {
        const [year, month] = monthFilter.split('-').map(Number);
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        console.log(`[${correlationId}] Filtering transactions by date range:`, { startDate, endDate });
        query = query.gte('data_transacao', startDate).lte('data_transacao', endDate);
      } else {
        // Get last 12 months of data
        const currentDate = new Date();
        const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
        const startDate = twelveMonthsAgo.toISOString().split('T')[0];
        query = query.gte('data_transacao', startDate);
      }

      // Check if request was aborted
      if (signal?.aborted) {
        console.log(`[${correlationId}] Request aborted during query setup`);
        return [];
      }

      const { data: transactions, error } = await query.order('data_transacao', { ascending: true });

      if (error) {
        console.error(`[${correlationId}] Supabase transacoes_conciliadas error:`, {
          error,
          code: (error as any)?.code,
          message: error.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          monthFilter,
          userId: user.id
        });
        
        // Create enhanced error with more context
        const enhancedError: any = new Error(`Erro na consulta transacoes_conciliadas: ${error.message}`);
        enhancedError.code = (error as any)?.code;
        enhancedError.details = (error as any)?.details;
        enhancedError.hint = (error as any)?.hint;
        enhancedError.originalError = error;
        
        throw enhancedError;
      }

      if (!transactions || transactions.length === 0) {
        console.log(`[${correlationId}] No transactions found`);
        return [];
      }

      // Check if request was aborted after fetch
      if (signal?.aborted) {
        console.log(`[${correlationId}] Request aborted after fetch`);
        return [];
      }

      // Group transactions by month/year
      const monthlyData = new Map<string, any>();

      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.data_transacao);
        const year = transactionDate.getFullYear();
        const month = transactionDate.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!monthlyData.has(key)) {
          monthlyData.set(key, {
            ano: year,
            mes: month,
            total_entradas: 0,
            total_saidas: 0,
            categoria_gastos: {},
            categoria_receitas: {},
            dados_brutos: [],
            insights: { insights: [], gerado_em: new Date().toISOString() }
          });
        }

        const monthData = monthlyData.get(key);
        const valor = Math.abs(Number(transaction.valor));
        const categoria = transaction.categoria_final || transaction.categoria_sugerida || 'Outros';

        monthData.dados_brutos.push(transaction);

        if (transaction.tipo === 'entrada') {
          monthData.total_entradas += valor;
          monthData.categoria_receitas[categoria] = (monthData.categoria_receitas[categoria] || 0) + valor;
        } else {
          monthData.total_saidas += valor;
          monthData.categoria_gastos[categoria] = (monthData.categoria_gastos[categoria] || 0) + valor;
        }
      });

      // Convert to PainelMensal format
      const result = Array.from(monthlyData.values()).map((data, index) => ({
        id: `calculated-${data.ano}-${data.mes}`,
        usuario_id: user.id,
        ano: data.ano,
        mes: data.mes,
        total_entradas: data.total_entradas,
        total_saidas: data.total_saidas,
        categoria_gastos: data.categoria_gastos,
        categoria_receitas: data.categoria_receitas,
        dados_brutos: data.dados_brutos,
        insights: data.insights,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }));

      console.log(`[${correlationId}] Calculated dashboard data:`, result.length, 'records');
      return result;

    } catch (error) {
      console.error(`[${correlationId}] Error calculating dashboard:`, error);
      throw error;
    }
  }, [user?.id, correlationId]);

  // Main data fetching function with race condition protection
  const fetchDashboardData = useCallback(async (monthFilter?: string): Promise<PainelMensal[]> => {
    if (!user?.id) {
      console.log(`[${correlationId}] No user ID available, skipping data load`);
      return [];
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    console.log(`[${correlationId}] Fetching dashboard data`, { 
      userId: user.id, 
      monthFilter, 
      requestId 
    });

    try {
      // First try to get data from painel_mensal
      let query = supabase
        .from('painel_mensal')
        .select('*')
        .eq('usuario_id', user.id);

      if (monthFilter) {
        const [ano, mes] = monthFilter.split('-').map(Number);
        console.log(`[${correlationId}] Loading painel_mensal for month:`, { ano, mes });
        query = query.eq('ano', ano).eq('mes', mes);
      } else {
        // Get last 12 months
        const currentDate = new Date();
        const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
        console.log(`[${correlationId}] Loading painel_mensal for last 12 months from:`, twelveMonthsAgo);
        query = query
          .gte('ano', twelveMonthsAgo.getFullYear())
          .order('ano', { ascending: false })
          .order('mes', { ascending: false });
      }

      // Check if this request is still the latest
      if (requestId !== requestIdRef.current || controller.signal.aborted) {
        console.log(`[${correlationId}] Request ${requestId} cancelled - newer request in progress`);
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[${correlationId}] Supabase painel_mensal error:`, {
          error,
          code: (error as any)?.code,
          message: error.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          monthFilter,
          userId: user.id
        });
        
        // Create enhanced error with more context
        const enhancedError: any = new Error(`Erro na consulta painel_mensal: ${error.message}`);
        enhancedError.code = (error as any)?.code;
        enhancedError.details = (error as any)?.details;
        enhancedError.hint = (error as any)?.hint;
        enhancedError.originalError = error;
        
        throw enhancedError;
      }

      // Double-check request is still valid
      if (requestId !== requestIdRef.current || controller.signal.aborted) {
        console.log(`[${correlationId}] Request ${requestId} cancelled after painel_mensal fetch`);
        return [];
      }

      console.log(`[${correlationId}] Painel mensal data received:`, data?.length || 0, 'records');

      // If painel_mensal has data, use it
      if (data && data.length > 0) {
        const convertedData = convertPainelData(data);
        console.log(`[${correlationId}] Using painel_mensal data:`, convertedData.length, 'records');
        return convertedData;
      } else {
        // Fallback: calculate from transacoes_conciliadas
        console.log(`[${correlationId}] Painel mensal empty, calculating from transactions...`);
        const calculatedData = await calculateDashboardFromTransactions(monthFilter, controller.signal);
        
        // Final check before returning
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          console.log(`[${correlationId}] Request ${requestId} cancelled after calculation`);
          return [];
        }
        
        console.log(`[${correlationId}] Calculated data from transactions:`, calculatedData.length, 'records');
        return calculatedData;
      }
      
    } catch (error: any) {
      if (controller.signal.aborted) {
        console.log(`[${correlationId}] Request ${requestId} aborted`);
        return [];
      }
      
      // Enhanced error logging with detailed information
      const errorInfo = {
        message: error?.message || 'Erro desconhecido',
        code: error?.code || null,
        details: error?.details || null,
        hint: error?.hint || null,
        status: error?.status || null,
        statusText: error?.statusText || null,
        requestId,
        monthFilter,
        userId: user?.id,
        timestamp: new Date().toISOString()
      };
      
      console.error(`[${correlationId}] Detailed error fetching dashboard data:`, {
        originalError: error,
        errorInfo,
        stack: error?.stack
      });
      
      // Create a more informative error object
      const enhancedError: any = new Error(error?.message || 'Falha ao carregar dados financeiros');
      enhancedError.code = error?.code;
      enhancedError.details = error?.details;
      enhancedError.hint = error?.hint;
      enhancedError.status = error?.status;
      
      throw enhancedError;
    }
  }, [user?.id, convertPainelData, calculateDashboardFromTransactions, correlationId]);

  // React Query hook for dashboard data
  const {
    data: painelData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.dashboardData(user?.id || '', selectedMonth),
    queryFn: () => fetchDashboardData(selectedMonth),
    enabled: !!user?.id,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes (renamed from cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData, // Replacement for keepPreviousData
  });

  // Invalidate queries when visibility changes (soft refetch only)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && user?.id) {
      console.log(`[${correlationId}] Tab visible - soft refetch`);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.dashboardData(user.id, selectedMonth)
      });
    }
  }, [user?.id, selectedMonth, queryClient, correlationId]);

  // Set up visibility change listener
  useMemo(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Calcular dados do mês atual
  const currentMonthData = useMemo(() => {
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

  // Get raw transactions data for the ExpenseChart component
  const transactionsForSelectedMonth = useMemo(() => {
    return ('dados_brutos' in currentMonthData && currentMonthData.dados_brutos) ? currentMonthData.dados_brutos : [];
  }, [currentMonthData]);

  // Preparar dados para gráfico de pizza (receitas por categoria)
  const incomeChartData = useMemo((): ChartData[] => {
    const data = Object.entries(currentMonthData.categoria_receitas || {})
      .map(([categoria, valor]) => ({
        name: categoria,
        value: Number(valor),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      }))
      .sort((a, b) => b.value - a.value);
    
    return data;
  }, [currentMonthData]);

  // Preparar dados para gráfico mensal (linha/coluna)
  const monthlyChartData = useMemo((): MonthlyData[] => {
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
  const kpiData = useMemo(() => {
    const totalEntradas = Number(currentMonthData.total_entradas || 0);
    const totalSaidas = Number(currentMonthData.total_saidas || 0);
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
      insights: currentMonthData.insights?.insights || []
    };
  }, [currentMonthData, painelData, selectedMonth]);

  // Formatar moeda brasileira
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  // Manual refresh function with proper cache invalidation
  const refreshData = useCallback(async () => {
    console.log(`[${correlationId}] Manual refresh triggered`);
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.dashboardData(user?.id || '', selectedMonth)
    });
  }, [user?.id, selectedMonth, queryClient, correlationId]);

  // Verificar se há dados disponíveis
  const hasData = painelData.length > 0;

  return {
    painelData,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    error,
    hasData,
    currentMonthData,
    transactionsForSelectedMonth,
    incomeChartData,
    monthlyChartData,
    kpiData,
    formatCurrency,
    refreshData,
    correlationId
  };
}