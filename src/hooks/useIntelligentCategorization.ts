import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from './useConciliacao';

// Regras inteligentes de categorização baseadas em palavras-chave
const CATEGORIZATION_RULES = {
  // Receitas
  receitas: {
    'Vendas': ['venda', 'pix recebido', 'transferencia recebida', 'pagamento', 'credito', 'deposito'],
    'Prestação de Serviços': ['servico', 'honorario', 'consultoria', 'freelance', 'trabalho'],
    'Recebimentos': ['recebimento', 'cobranca', 'duplicata', 'fatura'],
    'Juros e Rendimentos': ['juros', 'rendimento', 'aplicacao', 'cdb', 'poupanca', 'investimento'],
    'Outros Receitas': ['reembolso', 'devolucao', 'estorno']
  },
  
  // Despesas
  despesas: {
    'Fornecedores': ['fornecedor', 'compra', 'pagamento', 'nota fiscal', 'mercadoria'],
    'Salários': ['salario', 'folha', 'inss', 'fgts', 'vale', 'funcionario', 'colaborador'],
    'Impostos': ['imposto', 'tributo', 'iss', 'icms', 'ipi', 'pis', 'cofins', 'csll', 'irpj', 'simples'],
    'Aluguel': ['aluguel', 'locacao', 'imovel', 'condominio'],
    'Utilidades': ['energia', 'luz', 'agua', 'gas', 'telefone', 'internet', 'celular', 'tim', 'vivo', 'claro', 'oi'],
    'Marketing': ['marketing', 'publicidade', 'propaganda', 'anuncio', 'google ads', 'facebook', 'instagram'],
    'Transporte': ['combustivel', 'gasolina', 'etanol', 'uber', '99', 'taxi', 'pedagio', 'estacionamento'],
    'Alimentação': ['restaurante', 'lanchonete', 'ifood', 'rappi', 'delivery', 'supermercado', 'mercado'],
    'Saúde': ['farmacia', 'drogaria', 'medico', 'consulta', 'exame', 'hospital', 'clinica'],
    'Tarifa bancária': ['tarifa', 'taxa', 'anuidade', 'manutencao', 'saque', 'ted', 'doc'],
    'Outros Despesas': ['diversos', 'outros', 'geral']
  }
};

interface CategorizationAnalysis {
  suggestedCategory: string;
  confidence: number;
  matchedKeywords: string[];
  transactionType: 'entrada' | 'saida';
}

export function useIntelligentCategorization() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Função para analisar e categorizar uma transação
  const analyzeTransaction = useCallback((transaction: Omit<Transaction, 'categoria_sugerida'>): CategorizationAnalysis => {
    const description = transaction.descricao.toLowerCase();
    const isIncome = transaction.valor >= 0;
    const categoryGroup = isIncome ? CATEGORIZATION_RULES.receitas : CATEGORIZATION_RULES.despesas;
    
    let bestMatch = {
      category: isIncome ? 'Outros Receitas' : 'Outros Despesas',
      confidence: 0,
      matchedKeywords: [] as string[]
    };

    // Analisar cada categoria
    Object.entries(categoryGroup).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => description.includes(keyword));
      
      if (matches.length > 0) {
        // Calcular confiança baseada no número de palavras-chave encontradas
        const confidence = Math.min((matches.length / keywords.length) * 100, 95);
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category,
            confidence,
            matchedKeywords: matches
          };
        }
      }
    });

    // Regras especiais baseadas em valor
    if (isIncome && transaction.valor > 10000) {
      // Valores altos de entrada podem ser vendas importantes
      if (bestMatch.confidence < 50) {
        bestMatch = {
          category: 'Vendas',
          confidence: 60,
          matchedKeywords: ['valor alto']
        };
      }
    }

    // Regras especiais para transferências
    if (description.includes('transferencia') || description.includes('pix')) {
      if (isIncome) {
        bestMatch.category = 'Recebimentos';
      } else {
        bestMatch.category = 'Fornecedores';
      }
      bestMatch.confidence = Math.max(bestMatch.confidence, 70);
    }

    return {
      suggestedCategory: bestMatch.category,
      confidence: bestMatch.confidence,
      matchedKeywords: bestMatch.matchedKeywords,
      transactionType: isIncome ? 'entrada' : 'saida'
    };
  }, []);

  // Função para processar múltiplas transações
  const processTransactions = useCallback(async (
    transactions: Omit<Transaction, 'categoria_sugerida'>[]
  ): Promise<Transaction[]> => {
    setIsAnalyzing(true);
    
    try {
      const processedTransactions = transactions.map(transaction => {
        const analysis = analyzeTransaction(transaction);
        
        return {
          ...transaction,
          categoria_sugerida: analysis.suggestedCategory,
          tipo: analysis.transactionType
        } as Transaction;
      });

      return processedTransactions;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeTransaction]);

  // Função para obter estatísticas da categorização
  const getCategorizationStats = useCallback((transactions: Transaction[]) => {
    const stats = {
      total: transactions.length,
      categorized: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      byCategory: {} as Record<string, number>
    };

    transactions.forEach(transaction => {
      if (transaction.categoria_sugerida) {
        stats.categorized++;
        
        // Simular confiança baseada na categoria
        const analysis = analyzeTransaction(transaction);
        if (analysis.confidence >= 80) {
          stats.highConfidence++;
        } else if (analysis.confidence >= 50) {
          stats.mediumConfidence++;
        } else {
          stats.lowConfidence++;
        }

        // Contar por categoria
        const category = transaction.categoria_sugerida;
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      }
    });

    return stats;
  }, [analyzeTransaction]);

  // Função para melhorar a categorização baseada no histórico do usuário
  const improveWithUserHistory = useCallback(async (
    userId: string, 
    transactions: Transaction[]
  ): Promise<Transaction[]> => {
    try {
      // Buscar histórico de categorizações do usuário
      const { data: userHistory } = await supabase
        .from('transacoes_conciliadas')
        .select('descricao, categoria_final')
        .eq('user_id', userId)
        .not('categoria_final', 'is', null)
        .limit(1000);

      if (!userHistory || userHistory.length === 0) {
        return transactions;
      }

      // Criar mapa de aprendizado baseado no histórico
      const learningMap = new Map<string, string>();
      userHistory.forEach(record => {
        if (record.descricao && record.categoria_final) {
          const key = record.descricao.toLowerCase().substring(0, 20);
          learningMap.set(key, record.categoria_final);
        }
      });

      // Aplicar aprendizado às novas transações
      return transactions.map(transaction => {
        const key = transaction.descricao.toLowerCase().substring(0, 20);
        const learnedCategory = learningMap.get(key);
        
        if (learnedCategory) {
          return {
            ...transaction,
            categoria_sugerida: learnedCategory
          };
        }
        
        return transaction;
      });
    } catch (error) {
      console.error('Erro ao melhorar categorização com histórico:', error);
      return transactions;
    }
  }, []);

  return {
    isAnalyzing,
    analyzeTransaction,
    processTransactions,
    getCategorizationStats,
    improveWithUserHistory,
    CATEGORIZATION_RULES
  };
}