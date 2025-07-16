import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

import { useIntelligentCategorization } from './useIntelligentCategorization';

export interface Transaction {
  id: string;
  user_id?: string;
  company_id?: string;
  data_transacao: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  categoria_sugerida?: string;
  categoria_final?: string;
  status_conciliacao: boolean;
  origem_arquivo?: string;
  hash_transacao?: string;
  mes_referencia?: string;
  criado_em?: string;
}

export interface UserCategory {
  id: string;
  user_id: string;
  nome_categoria: string;
  cor?: string;
  ativo: boolean;
}

export function useConciliacao() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const { user } = useAuth();
  const { toast } = useToast();
  const { processTransactions, improveWithUserHistory } = useIntelligentCategorization();

  // Função para sugerir categoria baseada na descrição (mantido para compatibilidade)
  const suggestCategory = useCallback(async (descricao: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .rpc('sugerir_categoria', { descricao_input: descricao });
      
      if (error) {
        console.error('Erro ao sugerir categoria:', error);
        return 'Outros';
      }
      
      return data || 'Outros';
    } catch (error) {
      console.error('Erro ao sugerir categoria:', error);
      return 'Outros';
    }
  }, []);

  // Carregar transações do usuário com filtros de mês e empresa
  const loadTransactions = useCallback(async (monthFilter?: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id);

      // Filtrar por mês se especificado
      if (monthFilter) {
        const startDate = `${monthFilter}-01`;
        const endDate = `${monthFilter}-31`;
        query = query.gte('data_transacao', startDate).lte('data_transacao', endDate);
      }

      const { data, error } = await query.order('data_transacao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar transações:', error);
        toast({
          title: 'Erro ao carregar transações',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: 'Erro ao carregar transações',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Carregar categorias do usuário
  const loadUserCategories = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('categorias_usuario')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome_categoria');

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }

      setUserCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, [user?.id]);

  // Salvar transações no banco com suporte a empresa e mês de referência
  const saveTransactions = useCallback(async (newTransactions: Transaction[]) => {
    if (!user?.id) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para importar transações',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log('Salvando', newTransactions.length, 'transações para o usuário', user.id);
      
      if (!newTransactions || newTransactions.length === 0) {
        throw new Error('Nenhuma transação para salvar');
      }
      // Processar transações com categorização inteligente
      console.log('Aplicando categorização inteligente...');
      const intelligentlyProcessed = await processTransactions(newTransactions);
      
      // Melhorar com histórico do usuário
      const improvedTransactions = await improveWithUserHistory(user.id, intelligentlyProcessed);

      const transactionsWithCategories = improvedTransactions.map((transaction) => {
        // Gerar hash para evitar duplicatas
        const hashData = `${transaction.data_transacao}_${transaction.valor}_${transaction.descricao}_${user.id}`;
        const hash_transacao = btoa(hashData).replace(/[^a-zA-Z0-9]/g, '');

        // Validar dados obrigatórios
        if (!transaction.data_transacao || transaction.valor === null || transaction.valor === undefined) {
          console.error('Transação com dados inválidos:', transaction);
          return null;
        }

        return {
          ...transaction,
          user_id: user.id,
          hash_transacao,
          status_conciliacao: false,
        };
      }).filter(Boolean); // Remove transações nulas

      // Inserir no banco (com tratamento de duplicatas)
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .upsert(transactionsWithCategories, { 
          onConflict: 'hash_transacao',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Erro ao salvar transações:', error);
        toast({
          title: 'Erro ao salvar transações',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      await loadTransactions(selectedMonth);
      
      toast({
        title: 'Transações importadas',
        description: `${transactionsWithCategories.length} transações importadas com sucesso`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      toast({
        title: 'Erro ao salvar transações',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, suggestCategory, loadTransactions, selectedMonth, toast]);

  // Atualizar transação (categoria, descrição, etc.)
  const updateTransactionCategory = useCallback(async (transactionId: string, updates: Partial<Transaction> | string) => {
    if (!user?.id) return false;

    try {
      // Se o segundo parâmetro for string, trata como categoria_final (para compatibilidade)
      const updateData = typeof updates === 'string' 
        ? { categoria_final: updates, status_conciliacao: true }
        : { ...updates, status_conciliacao: true };

      const { error } = await supabase
        .from('transacoes_conciliadas')
        .update(updateData)
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        toast({
          title: 'Erro ao atualizar transação',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // Atualizar estado local
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, ...updateData }
            : t
        )
      );

      toast({
        title: 'Transação atualizada',
        description: 'Transação foi atualizada com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: 'Erro ao atualizar transação',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast]);

  // Criar nova categoria de usuário
  const createUserCategory = useCallback(async (nome_categoria: string, cor?: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('categorias_usuario')
        .insert({
          user_id: user.id,
          nome_categoria,
          cor,
          ativo: true,
        });

      if (error) {
        console.error('Erro ao criar categoria:', error);
        toast({
          title: 'Erro ao criar categoria',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      await loadUserCategories();
      
      toast({
        title: 'Categoria criada',
        description: `Categoria "${nome_categoria}" foi criada com sucesso`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro ao criar categoria',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, loadUserCategories, toast]);


  return {
    transactions,
    userCategories,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    loadTransactions,
    loadUserCategories,
    saveTransactions,
    updateTransactionCategory,
    createUserCategory,
  };
}