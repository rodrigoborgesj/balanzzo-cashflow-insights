import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Transaction } from './useConciliacao';
import { FinancialData } from './useFinancialData';

export interface ReconciliationMatch {
  transaction: Transaction;
  financialRecord: FinancialData | null;
  matchType: 'exact' | 'approximate' | 'none';
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ReconciliationResult {
  totalTransactions: number;
  automaticMatches: number;
  manualReviewNeeded: number;
  matches: ReconciliationMatch[];
  summary: {
    exactMatches: number;
    approximateMatches: number;
    noMatches: number;
  };
}

export function useAutomaticReconciliation() {
  const { user } = useAuth();

  // Buscar dados financeiros existentes para cruzar com as transações
  const getExistingFinancialData = useCallback(async (companyId?: string, dateRange?: { start: string; end: string }) => {
    if (!user?.id) return [];

    try {
      let query = supabase
        .from('financial_data')
        .select(`
          *,
          companies (
            id,
            company_name,
            user_id
          )
        `)
        .order('date', { ascending: false });

      // Filtrar por empresa se especificado
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      // Filtrar por período se especificado
      if (dateRange) {
        query = query
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar dados financeiros:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      return [];
    }
  }, [user?.id]);

  // Calcular score de similaridade entre duas strings
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    
    // Levenshtein distance simplificado
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 100;
    
    let matches = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return (matches / maxLength) * 100;
  }, []);

  // Verificar correspondência entre transação e dado financeiro
  const findMatch = useCallback((transaction: Transaction, financialRecords: any[]): ReconciliationMatch => {
    let bestMatch: any = null;
    let bestScore = 0;
    let matchType: 'exact' | 'approximate' | 'none' = 'none';

    const transactionDate = new Date(transaction.data_transacao);
    const transactionValue = Math.abs(transaction.valor);

    for (const record of financialRecords) {
      const recordDate = new Date(record.date);
      const dateDiff = Math.abs(transactionDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24); // em dias
      
      // Verificar correspondência por valor
      let valueMatch = false;
      let recordValue = 0;
      
      if (transaction.tipo === 'entrada') {
        recordValue = Math.abs(record.revenue || 0);
      } else {
        recordValue = Math.abs(record.expenses || 0);
      }
      
      // Correspondência exata
      if (Math.abs(transactionValue - recordValue) < 0.01 && dateDiff <= 3) {
        bestMatch = record;
        bestScore = 100;
        matchType = 'exact';
        break;
      }
      
      // Correspondência aproximada
      const valueDiff = Math.abs(transactionValue - recordValue);
      const valuePercentDiff = recordValue > 0 ? (valueDiff / recordValue) * 100 : 100;
      
      if (valuePercentDiff <= 10 && dateDiff <= 7) { // 10% de diferença e até 7 dias
        const score = Math.max(0, 100 - valuePercentDiff - (dateDiff * 5));
        if (score > bestScore) {
          bestMatch = record;
          bestScore = score;
          matchType = 'approximate';
        }
      }
    }

    // Determinar confiança
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (bestScore >= 90) confidence = 'high';
    else if (bestScore >= 70) confidence = 'medium';

    return {
      transaction,
      financialRecord: bestMatch,
      matchType,
      matchScore: bestScore,
      confidence
    };
  }, []);

  // Executar conciliação automática
  const performAutomaticReconciliation = useCallback(async (
    transactions: Transaction[],
    companyId?: string
  ): Promise<ReconciliationResult> => {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        automaticMatches: 0,
        manualReviewNeeded: 0,
        matches: [],
        summary: { exactMatches: 0, approximateMatches: 0, noMatches: 0 }
      };
    }

    // Determinar período das transações
    const dates = transactions.map(t => new Date(t.data_transacao));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Expandir período para busca (±15 dias)
    startDate.setDate(startDate.getDate() - 15);
    endDate.setDate(endDate.getDate() + 15);

    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };

    // Buscar dados financeiros existentes
    const financialRecords = await getExistingFinancialData(companyId, dateRange);

    // Realizar correspondência para cada transação
    const matches: ReconciliationMatch[] = transactions.map(transaction => 
      findMatch(transaction, financialRecords)
    );

    // Calcular estatísticas
    const exactMatches = matches.filter(m => m.matchType === 'exact').length;
    const approximateMatches = matches.filter(m => m.matchType === 'approximate').length;
    const noMatches = matches.filter(m => m.matchType === 'none').length;
    
    const automaticMatches = matches.filter(m => m.confidence === 'high').length;
    const manualReviewNeeded = matches.length - automaticMatches;

    return {
      totalTransactions: transactions.length,
      automaticMatches,
      manualReviewNeeded,
      matches,
      summary: {
        exactMatches,
        approximateMatches,
        noMatches
      }
    };
  }, [getExistingFinancialData, findMatch]);

  // Aplicar conciliações automáticas de alta confiança
  const applyAutomaticReconciliations = useCallback(async (matches: ReconciliationMatch[]) => {
    if (!user?.id) return false;

    try {
      const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
      
      for (const match of highConfidenceMatches) {
        // Atualizar status da transação
        await supabase
          .from('transacoes_conciliadas')
          .update({ 
            status_conciliacao: true,
            categoria_final: match.transaction.categoria_sugerida || 'Conciliado Automaticamente'
          })
          .eq('id', match.transaction.id)
          .eq('user_id', user.id);
      }

      return true;
    } catch (error) {
      console.error('Erro ao aplicar conciliações automáticas:', error);
      return false;
    }
  }, [user?.id]);

  return {
    performAutomaticReconciliation,
    applyAutomaticReconciliations,
    getExistingFinancialData
  };
}